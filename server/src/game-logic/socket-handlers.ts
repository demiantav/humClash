import { Server, Socket } from "socket.io";
import { RoomManager } from "../rooms/RoomManager.js";
import { GameSession } from "./GameSession.js";
import { TurnManager } from "./TurnManager.js";
import { generateAgoraToken } from "./AgoraTokenGenerator.js";
import { addReport } from "../moderation/ReportHandler.js";

const gameSessions = new Map<string, GameSession>();
const turnManager = new TurnManager();

function getSession(roomCode: string): GameSession | undefined {
  return gameSessions.get(roomCode);
}

function createSession(roomManager: RoomManager, roomCode: string, io: Server): GameSession {
  const room = roomManager.getRoom(roomCode)!;
  const session = new GameSession(
    roomCode,
    room.players.map((p) => ({ id: p.id, nickname: p.nickname })),
    turnManager,
    (event, data) => io.to(roomCode).emit(event, data),
    (playerId, event, data) => io.to(playerId).emit(event, data),
    generateAgoraToken,
  );
  gameSessions.set(roomCode, session);
  return session;
}

function startGameIfReady(roomManager: RoomManager, roomCode: string, io: Server) {
  const room = roomManager.getRoom(roomCode);
  if (!room || room.players.length < 2) return;
  if (!roomManager.areAllPlayersReady(roomCode)) return;

  const session = createSession(roomManager, roomCode, io);
  setTimeout(() => session.startCountdown(), 500);
}

export function notifyGameStart(
  io: Server,
  roomManager: RoomManager,
  roomCode: string,
) {
  startGameIfReady(roomManager, roomCode, io);
}

export function handleGameDisconnect(
  io: Server,
  socketId: string,
  roomManager: RoomManager,
) {
  const room = roomManager.getRoomByPlayer(socketId);
  if (!room) return;

  const session = gameSessions.get(room.code);
  if (!session || session.phase === "game_over" || session.phase === "lobby") return;

  const opponentId = room.players.find((p) => p.id !== socketId)?.socketId;
  if (opponentId) {
    io.to(opponentId).emit("player_disconnected", {
      disconnectedPlayer: {
        id: socketId,
        nickname: roomManager.getPlayerNickname(socketId),
      },
    });
  }

  session.dispose();
  gameSessions.delete(room.code);
}

export function registerGameHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager,
) {
  socket.on("start_humming", ({ roomCode }: { roomCode: string }) => {
    const session = getSession(roomCode);
    if (!session) return;
    session.startGuessing();
  });

  socket.on("request_rehum", ({ roomCode }: { roomCode: string }) => {
    const session = getSession(roomCode);
    if (!session) return;
    session.requestRehum(socket.id);
  });

  socket.on(
    "submit_guess",
    ({ roomCode, songId }: { roomCode: string; songId: string }) => {
      const session = getSession(roomCode);
      if (!session) return;

      const result = session.handleGuess(songId, socket.id);
      if (result) {
        setTimeout(() => session.advanceRound(), 3000);
      }
    },
  );

  socket.on("request_rematch", ({ roomCode }: { roomCode: string }) => {
    const session = getSession(roomCode);
    if (!session) return;
    session.requestRematch(socket.id);
  });

  socket.on("accept_rematch", ({ roomCode }: { roomCode: string }) => {
    const session = getSession(roomCode);
    if (!session) return;
    session.requestRematch(socket.id);
  });

  socket.on(
    "report_player",
    ({ roomCode, reason }: { roomCode: string; reason: string }) => {
      const opponentId = roomManager.getOpponentSocketId(roomCode, socket.id);
      if (!opponentId) return;
      addReport({
        reporterId: socket.id,
        reportedId: opponentId,
        roomCode,
        reason,
        timestamp: Date.now(),
      });
    },
  );

  socket.on("leave_room", ({ roomCode }: { roomCode: string }) => {
    const session = gameSessions.get(roomCode);
    if (session) {
      session.dispose();
      gameSessions.delete(roomCode);
    }
    handleGameDisconnect(io, socket.id, roomManager);
  });
}
