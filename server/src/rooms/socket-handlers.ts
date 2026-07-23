import { Server, Socket } from "socket.io";
import { RoomManager } from "./RoomManager.js";
import { notifyGameStart } from "../game-logic/socket-handlers.js";

export function registerRoomHandlers(
  io: Server,
  socket: Socket,
  roomManager: RoomManager,
) {
  socket.on("create_room", ({ nickname }: { nickname: string }, callback) => {
    try {
      const { roomCode } = roomManager.createRoom(socket.id, nickname);
      socket.join(roomCode);
      callback({ success: true, roomCode });
      console.log(`[room] ${roomCode} — created by ${nickname}`);
    } catch (err) {
      callback({ success: false, error: "Failed to create room" });
    }
  });

  socket.on(
    "join_room",
    (
      { roomCode, nickname }: { roomCode: string; nickname: string },
      callback,
    ) => {
      try {
        const room = roomManager.joinRoom(roomCode, socket.id, nickname);
        socket.join(roomCode);
        callback({ success: true, room });

        socket.to(roomCode).emit("room_joined", { room });
        console.log(`[room] ${roomCode} — ${nickname} joined`);
      } catch (err: any) {
        const message =
          err.message === "room_not_found"
            ? "El código no existe"
            : err.message === "room_full"
              ? "La sala está llena"
              : "Error al unirse";
        callback({ success: false, error: message });
      }
    },
  );

  socket.on("player_ready", ({ roomCode }: { roomCode: string }) => {
    const room = roomManager.setPlayerReady(socket.id);
    if (room) {
      io.to(room.code).emit("player_ready_update", { room });

      if (roomManager.areAllPlayersReady(room.code)) {
        setTimeout(() => notifyGameStart(io, roomManager, room.code), 300);
      }
    }
  });

  socket.on("leave_room", ({ roomCode }: { roomCode: string }) => {
    const opponentId = roomManager.getOpponentSocketId(roomCode, socket.id);
    socket.leave(roomCode);
    roomManager.handleDisconnect(socket.id);
    if (opponentId) {
      io.to(opponentId).emit("player_disconnected", {
        disconnectedPlayer: {
          id: socket.id,
          nickname: roomManager.getPlayerNickname(socket.id),
        },
      });
    }
  });
}
