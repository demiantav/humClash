import { Server, Socket } from "socket.io";
import { RoomManager } from "../rooms/RoomManager.js";
import { GameState, GamePhase, RoundResult, ScoreEntry } from "./types.js";
import { pickRoundSongs } from "./SongBank.js";
import { calculateScore, computeFinalScores } from "./Scoring.js";
import { addReport } from "../moderation/ReportHandler.js";

const gameSessions = new Map<string, GameState>();
const gameTimers = new Map<string, ReturnType<typeof setInterval>>();

function createGameState(roomCode: string): GameState {
  return {
    roomCode,
    phase: "lobby",
    currentRound: 0,
    totalRounds: 5,
    scores: [],
    rounds: [],
    timeLimit: 0,
  };
}

function getOrCreateGameState(roomCode: string): GameState {
  if (!gameSessions.has(roomCode)) {
    gameSessions.set(roomCode, createGameState(roomCode));
  }
  return gameSessions.get(roomCode)!;
}

export function registerGameHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager
) {
  socket.on("start_game", ({ roomCode }: { roomCode: string }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.players.length < 2) return;
    if (!roomManager.areAllPlayersReady(roomCode)) return;

    const state = getOrCreateGameState(roomCode);
    state.phase = "countdown";

    io.to(roomCode).emit("game_starting", {
      round: 1,
      totalRounds: state.totalRounds,
    });

    setTimeout(() => startNewRound(io, roomManager, roomCode), 4000);
  });

  socket.on("submit_guess", ({ roomCode, songId }: { roomCode: string; songId: string }) => {
    const state = gameSessions.get(roomCode);
    if (!state || state.phase !== "round_active") return;

    const currentRound = state.rounds[state.rounds.length - 1];
    if (!currentRound || currentRound.guess) return;

    clearTimer(roomCode);

    const timeLimit = state.timeLimit;
    const elapsed = Math.round((Date.now() - roundStartTimes.get(roomCode)!) / 1000);
    const timeTaken = Math.min(elapsed, timeLimit);
    const correct = songId === currentRound.song.id;
    const score = calculateScore(correct, timeTaken, timeLimit);

    currentRound.guess = songId;
    currentRound.correct = correct;
    currentRound.timeTaken = timeTaken;
    currentRound.score = score;

    state.phase = "round_result";

    const room = roomManager.getRoom(roomCode)!;

    const roundScores = computeFinalScores(
      state.rounds,
      room.players.map((p) => ({ id: p.id, nickname: p.nickname }))
    );
    state.scores = roundScores;

    const guesserEntry = roundScores.find((s) => s.playerId === socket.id);

    io.to(roomCode).emit("round_result", {
      correct,
      song: correct ? currentRound.song : { ...currentRound.song, title: currentRound.song.title },
      yourScore: score,
      scores: roundScores,
      timeTaken,
      guesserId: socket.id,
    });

    setTimeout(() => {
      if (state.currentRound >= state.totalRounds) {
        finishGame(io, roomManager, roomCode);
      } else {
        startNewRound(io, roomManager, roomCode);
      }
    }, 3000);
  });

  socket.on("timeout_round", ({ roomCode }: { roomCode: string }) => {
    const state = gameSessions.get(roomCode);
    if (!state || state.phase !== "round_active") return;

    const currentRound = state.rounds[state.rounds.length - 1];
    if (!currentRound || currentRound.guess) return;

    clearTimer(roomCode);

    currentRound.guess = null;
    currentRound.correct = false;
    currentRound.timeTaken = state.timeLimit;
    currentRound.score = 0;

    state.phase = "round_result";

    const room = roomManager.getRoom(roomCode)!;

    const roundScores = computeFinalScores(
      state.rounds,
      room.players.map((p) => ({ id: p.id, nickname: p.nickname }))
    );
    state.scores = roundScores;

    io.to(roomCode).emit("round_result", {
      correct: false,
      song: currentRound.song,
      yourScore: 0,
      scores: roundScores,
      timeTaken: state.timeLimit,
      timeout: true,
    });

    setTimeout(() => {
      if (state.currentRound >= state.totalRounds) {
        finishGame(io, roomManager, roomCode);
      } else {
        startNewRound(io, roomManager, roomCode);
      }
    }, 3000);
  });

  socket.on("request_rematch", ({ roomCode }: { roomCode: string }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    socket.to(roomCode).emit("rematch_requested", {
      playerId: socket.id,
      nickname: roomManager.getPlayerNickname(socket.id),
    });
  });

  socket.on("accept_rematch", ({ roomCode }: { roomCode: string }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    gameSessions.delete(roomCode);

    room.players.forEach((p) => (p.isReady = true));
    io.to(roomCode).emit("rematch_accepted");

    const state = getOrCreateGameState(roomCode);
    state.phase = "countdown";

    io.to(roomCode).emit("game_starting", {
      round: 1,
      totalRounds: state.totalRounds,
    });

    setTimeout(() => startNewRound(io, roomManager, roomCode), 4000);
  });

  socket.on("report_player", ({ roomCode, reason }: { roomCode: string; reason: string }) => {
    const opponentId = roomManager.getOpponentSocketId(roomCode, socket.id);
    if (!opponentId) return;

    addReport({
      reporterId: socket.id,
      reportedId: opponentId,
      roomCode,
      reason,
      timestamp: Date.now(),
    });
  });
}

const roundStartTimes = new Map<string, number>();

function startNewRound(io: Server, roomManager: RoomManager, roomCode: string) {
  const state = gameSessions.get(roomCode);
  if (!state) return;

  state.currentRound++;
  state.phase = "round_active";

  const usedSongIds = state.rounds.map((r) => r.song.id);
  const { correct, distractors } = pickRoundSongs(usedSongIds);

  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  const hummerIndex = (state.currentRound - 1) % 2;
  const hummer = room.players[hummerIndex];
  const guesser = room.players[1 - hummerIndex];

  const options = [...distractors, correct].sort(() => Math.random() - 0.5);
  const timeLimit = 15;

  state.timeLimit = timeLimit;
  roundStartTimes.set(roomCode, Date.now());

  const round: RoundResult = {
    roundNumber: state.currentRound,
    song: correct,
    hummerId: hummer.id,
    guesserId: guesser.id,
    guess: null,
    correct: false,
    timeTaken: 0,
    score: 0,
  };
  state.rounds.push(round);

  io.to(hummer.socketId).emit("new_round", {
    roundNumber: state.currentRound,
    song: correct,
    options: [],
    yourRole: "hummer",
    timeLimit: 20,
    totalRounds: state.totalRounds,
  });

  io.to(guesser.socketId).emit("new_round", {
    roundNumber: state.currentRound,
    song: null,
    options: options,
    yourRole: "guesser",
    timeLimit,
    totalRounds: state.totalRounds,
  });

  let elapsed = 0;
  const timer = setInterval(() => {
    elapsed++;
    io.to(roomCode).emit("timer_sync", {
      secondsElapsed: elapsed,
      timeLimit,
      serverTimestamp: Date.now(),
    });

    if (elapsed >= timeLimit) {
      clearTimer(roomCode);
      const currentRound = state.rounds[state.rounds.length - 1];
      if (currentRound && !currentRound.guess) {
        currentRound.guess = null;
        currentRound.correct = false;
        currentRound.timeTaken = timeLimit;
        currentRound.score = 0;

        state.phase = "round_result";
        io.to(roomCode).emit("round_result", {
          correct: false,
          song: correct,
          yourScore: 0,
          scores: computeFinalScores(
            state.rounds,
            room.players.map((p) => ({ id: p.id, nickname: p.nickname }))
          ),
          timeTaken: timeLimit,
          timeout: true,
        });

        setTimeout(() => {
          if (state.currentRound >= state.totalRounds) {
            finishGame(io, roomManager, roomCode);
          } else {
            startNewRound(io, roomManager, roomCode);
          }
        }, 3000);
      }
    }
  }, 1000);

  gameTimers.set(roomCode, timer);
}

function finishGame(io: Server, roomManager: RoomManager, roomCode: string) {
  const state = gameSessions.get(roomCode);
  if (!state) return;

  state.phase = "game_over";
  clearTimer(roomCode);

  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  const scores = computeFinalScores(
    state.rounds,
    room.players.map((p) => ({ id: p.id, nickname: p.nickname }))
  );

  const winner = scores[0].totalScore > scores[1].totalScore
    ? { id: scores[0].playerId, nickname: scores[0].nickname }
    : scores[1].totalScore > scores[0].totalScore
    ? { id: scores[1].playerId, nickname: scores[1].nickname }
    : null;

  io.to(roomCode).emit("game_over", {
    winner,
    scores,
    rounds: state.rounds,
  });
}

function clearTimer(roomCode: string) {
  const timer = gameTimers.get(roomCode);
  if (timer) {
    clearInterval(timer);
    gameTimers.delete(roomCode);
  }
}
