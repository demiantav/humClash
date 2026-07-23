import { GamePhase, RoundResult, ScoreEntry } from "./types.js";
import { pickRoundSongs } from "./SongBank.js";
import { calculateScore, computeFinalScores } from "./Scoring.js";
import { TurnManager } from "./TurnManager.js";

interface PlayerInfo {
  id: string;
  nickname: string;
}

type TokenGenerator = (
  channelName: string,
  uid: number,
  role: "publisher" | "subscriber",
) => { token: string; appId: string };

export class GameSession {
  roomCode: string;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  rounds: RoundResult[];
  timeLimit: number;
  humTimeLimit: number;
  guessTimeLimit: number;
  private turnManager: TurnManager;
  private players_: PlayerInfo[];
  private onEmit: (event: string, data: any) => void;
  private onEmitTo: (playerId: string, event: string, data: any) => void;
  private guessPhaseStarted: boolean = false;
  private guessPhaseStartTime: number = 0;
  private bothRequestedRematch: Set<string> = new Set();
  private generateToken: TokenGenerator;

  constructor(
    roomCode: string,
    players: PlayerInfo[],
    turnManager: TurnManager,
    onEmit: (event: string, data: any) => void,
    onEmitTo: (playerId: string, event: string, data: any) => void,
    generateToken: TokenGenerator,
  ) {
    this.roomCode = roomCode;
    this.players_ = players;
    this.phase = "lobby";
    this.currentRound = 0;
    this.totalRounds = 5;
    this.rounds = [];
    this.timeLimit = 0;
    this.humTimeLimit = 20;
    this.guessTimeLimit = 15;
    this.turnManager = turnManager;
    this.onEmit = onEmit;
    this.onEmitTo = onEmitTo;
    this.generateToken = generateToken;
  }

  get players(): PlayerInfo[] {
    return this.players_;
  }

  getHummerId(): string {
    const hummerIndex = (this.currentRound - 1) % 2;
    return this.players_[hummerIndex]?.id ?? "";
  }

  getGuesserId(): string {
    const guesserIndex = 1 - ((this.currentRound - 1) % 2);
    return this.players_[guesserIndex]?.id ?? "";
  }

  getCurrentRound(): RoundResult | undefined {
    return this.rounds[this.rounds.length - 1];
  }

  private emitAll(event: string, data: any) {
    this.onEmit(event, { ...data, roomCode: this.roomCode });
  }

  private emitTo(playerId: string, event: string, data: any) {
    this.onEmitTo(playerId, event, { ...data, roomCode: this.roomCode });
  }

  startCountdown(): void {
    if (this.phase !== "lobby" && this.phase !== "game_over" && this.phase !== "round_result") return;
    this.phase = "countdown";
    this.bothRequestedRematch.clear();
    this.guessPhaseStarted = false;

    this.emitAll("game_starting", { round: 1, totalRounds: this.totalRounds });

    let count = 3;
    const countdownInterval = setInterval(() => {
      this.emitAll("countdown_tick", { count });
      count--;
      if (count < 0) {
        clearInterval(countdownInterval);
        this.startRound();
      }
    }, 1000);
  }

  private startRound(): void {
    this.currentRound++;
    this.phase = "round_active";
    this.guessPhaseStarted = false;

    const usedSongIds = this.rounds.map((r) => r.song.id);
    const { correct, distractors } = pickRoundSongs(usedSongIds);

    const options = [...distractors, correct].sort(() => Math.random() - 0.5);
    this.timeLimit = this.guessTimeLimit;
    this.guessPhaseStartTime = Date.now();

    const round: RoundResult = {
      roundNumber: this.currentRound,
      song: correct,
      hummerId: this.getHummerId(),
      guesserId: this.getGuesserId(),
      guess: null,
      correct: false,
      timeTaken: 0,
      score: 0,
    };
    this.rounds.push(round);

    const hummerId = this.getHummerId();
    const guesserId = this.getGuesserId();

    const hummerToken = this.generateToken(this.roomCode, 0, "publisher");
    const guesserToken = this.generateToken(this.roomCode, 1, "subscriber");

    this.emitTo(hummerId, "agora_token", { token: hummerToken.token, channel: this.roomCode, uid: 0, role: "publisher" });
    this.emitTo(guesserId, "agora_token", { token: guesserToken.token, channel: this.roomCode, uid: 1, role: "subscriber" });

    this.emitTo(hummerId, "new_round", {
      roundNumber: this.currentRound,
      song: correct,
      options: [],
      yourRole: "hummer",
      timeLimit: this.humTimeLimit,
      totalRounds: this.totalRounds,
      opponentNickname: this.players_.find((p) => p.id === guesserId)?.nickname,
    });

    this.emitTo(guesserId, "new_round", {
      roundNumber: this.currentRound,
      song: null,
      options,
      yourRole: "guesser",
      timeLimit: this.guessTimeLimit,
      totalRounds: this.totalRounds,
      opponentNickname: this.players_.find((p) => p.id === hummerId)?.nickname,
    });

    let elapsed = 0;
    this.turnManager.startTimer(
      this.roomCode,
      (timerElapsed) => {
        elapsed = timerElapsed;
        this.emitAll("timer_sync", {
          secondsElapsed: elapsed,
          timeLimit: this.guessTimeLimit,
          serverTimestamp: Date.now(),
        });
      },
      () => {
        this.handleTimeout();
      },
      this.guessTimeLimit,
    );
  }

  startGuessing(): void {
    if (this.phase !== "round_active" || this.guessPhaseStarted) return;
    this.guessPhaseStarted = true;
    this.guessPhaseStartTime = Date.now();
    this.emitTo(this.getGuesserId(), "humming_started", {
      message: "Tu rival empezó a tararear. ¡Escuchá bien!",
    });
  }

  requestRehum(requesterId: string): void {
    if (this.phase !== "round_active") return;
    const hummerId = this.getHummerId();
    if (requesterId !== this.getGuesserId()) return;

    this.emitTo(hummerId, "rehum_requested", {
      message: "Tu rival no entiende. ¡Tarareá de nuevo!",
    });
  }

  handleGuess(songId: string, guesserId: string): RoundResult | null {
    if (this.phase !== "round_active") return null;

    const currentRound = this.getCurrentRound();
    if (!currentRound || currentRound.guess || guesserId !== currentRound.guesserId) return null;

    this.turnManager.clearTimer(this.roomCode);

    const elapsed = Math.round((Date.now() - this.guessPhaseStartTime) / 1000);
    const timeTaken = Math.max(0, Math.min(elapsed, this.guessTimeLimit));
    const correct = songId === currentRound.song.id;
    const score = calculateScore(correct, timeTaken, this.guessTimeLimit);

    currentRound.guess = songId;
    currentRound.correct = correct;
    currentRound.timeTaken = timeTaken;
    currentRound.score = score;

    this.phase = "round_result";

    const scores = computeFinalScores(
      this.rounds,
      this.players_.map((p) => ({ id: p.id, nickname: p.nickname })),
    );

    this.emitAll("round_result", {
      roundNumber: this.currentRound,
      correct,
      song: currentRound.song,
      score,
      timeTaken,
      guesserId,
      scores,
    });

    return currentRound;
  }

  handleTimeout(): void {
    if (this.phase !== "round_active") return;

    const currentRound = this.getCurrentRound();
    if (!currentRound) return;

    this.turnManager.clearTimer(this.roomCode);

    if (currentRound.guess) return;

    currentRound.guess = null;
    currentRound.correct = false;
    currentRound.timeTaken = this.guessTimeLimit;
    currentRound.score = 0;

    this.phase = "round_result";

    const scores = computeFinalScores(
      this.rounds,
      this.players_.map((p) => ({ id: p.id, nickname: p.nickname })),
    );

    this.emitAll("round_result", {
      roundNumber: this.currentRound,
      correct: false,
      song: currentRound.song,
      score: 0,
      timeTaken: this.guessTimeLimit,
      timeout: true,
      scores,
    });
  }

  advanceRound(): void {
    if (this.phase !== "round_result") return;

    if (this.currentRound >= this.totalRounds) {
      this.finishGame();
    } else {
      this.startCountdown();
    }
  }

  finishGame(): void {
    this.phase = "game_over";
    this.turnManager.clearTimer(this.roomCode);

    const scores = computeFinalScores(
      this.rounds,
      this.players_.map((p) => ({ id: p.id, nickname: p.nickname })),
    );

    const winner =
      scores[0].totalScore > scores[1].totalScore
        ? { id: scores[0].playerId, nickname: scores[0].nickname }
        : scores[1].totalScore > scores[0].totalScore
          ? { id: scores[1].playerId, nickname: scores[1].nickname }
          : null;

    this.emitAll("game_over", {
      winner,
      scores,
      rounds: this.rounds.map((r) => ({
        roundNumber: r.roundNumber,
        song: r.song,
        correct: r.correct,
        score: r.score,
        guesserId: r.guesserId,
        guesserNickname: this.players_.find((p) => p.id === r.guesserId)?.nickname,
        timeTaken: r.timeTaken,
      })),
    });
  }

  requestRematch(playerId: string): { bothWant: boolean } {
    if (this.phase !== "game_over") return { bothWant: false };

    this.bothRequestedRematch.add(playerId);
    const opponentId = this.players_.find((p) => p.id !== playerId)?.id ?? "";

    this.emitTo(opponentId, "rematch_requested", {
      playerId,
      nickname: this.players_.find((p) => p.id === playerId)?.nickname,
    });

    const bothWant = this.bothRequestedRematch.size === 2;
    if (bothWant) {
      this.acceptRematch();
    }

    return { bothWant };
  }

  private acceptRematch(): void {
    this.currentRound = 0;
    this.rounds = [];
    this.timeLimit = 0;
    this.guessPhaseStarted = false;
    this.bothRequestedRematch.clear();
    this.turnManager.clearTimer(this.roomCode);

    this.emitAll("rematch_accepted", {});

    setTimeout(() => {
      this.startCountdown();
    }, 1000);
  }

  reportPlayer(reporterId: string, reason: string): { reportedId: string } | null {
    const opponentId = this.players_.find((p) => p.id !== reporterId)?.id;
    if (!opponentId) return null;
    return { reportedId: opponentId };
  }

  dispose(): void {
    this.turnManager.clearTimer(this.roomCode);
  }
}
