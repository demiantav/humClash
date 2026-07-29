import { describe, it, expect, beforeEach } from "vitest";
import { RoomManager } from "./RoomManager.js";

describe("RoomManager", () => {
  let rm: RoomManager;

  beforeEach(() => {
    rm = new RoomManager();
  });

  describe("createRoom", () => {
    it("returns a 6-char code from the safe charset", () => {
      const { roomCode } = rm.createRoom("sock1", "Alice");
      expect(roomCode).toHaveLength(6);
      expect(roomCode).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
    });

    it("registers the host as the only player", () => {
      const { roomCode } = rm.createRoom("sock1", "Alice");
      const room = rm.getRoom(roomCode)!;
      expect(room.players).toHaveLength(1);
      expect(room.players[0]).toMatchObject({
        id: "sock1",
        nickname: "Alice",
        isReady: false,
      });
    });
  });

  describe("joinRoom", () => {
    it("adds a second player", () => {
      const { roomCode } = rm.createRoom("sock1", "Alice");
      const room = rm.joinRoom(roomCode, "sock2", "Bob");
      expect(room.players).toHaveLength(2);
      expect(room.players[1].nickname).toBe("Bob");
    });

    it("throws room_not_found for unknown code", () => {
      expect(() => rm.joinRoom("XXXXXX", "sock2", "Bob")).toThrow("room_not_found");
    });

    it("throws room_full when already 2 players", () => {
      const { roomCode } = rm.createRoom("sock1", "Alice");
      rm.joinRoom(roomCode, "sock2", "Bob");
      expect(() => rm.joinRoom(roomCode, "sock3", "Charlie")).toThrow("room_full");
    });

    it("is idempotent if same socket rejoins", () => {
      const { roomCode } = rm.createRoom("sock1", "Alice");
      const room = rm.joinRoom(roomCode, "sock1", "Alice");
      expect(room.players).toHaveLength(1);
    });
  });

  describe("ready state", () => {
    it("toggles player ready", () => {
      const { roomCode } = rm.createRoom("sock1", "Alice");
      rm.joinRoom(roomCode, "sock2", "Bob");
      rm.setPlayerReady("sock1");
      expect(rm.getRoom(roomCode)!.players[0].isReady).toBe(true);
      rm.setPlayerReady("sock1");
      expect(rm.getRoom(roomCode)!.players[0].isReady).toBe(false);
    });

    it("areAllPlayersReady requires 2 ready players", () => {
      const { roomCode } = rm.createRoom("sock1", "Alice");
      expect(rm.areAllPlayersReady(roomCode)).toBe(false);
      rm.joinRoom(roomCode, "sock2", "Bob");
      expect(rm.areAllPlayersReady(roomCode)).toBe(false);
      rm.setPlayerReady("sock1");
      expect(rm.areAllPlayersReady(roomCode)).toBe(false);
      rm.setPlayerReady("sock2");
      expect(rm.areAllPlayersReady(roomCode)).toBe(true);
    });
  });

  describe("lookups", () => {
    it("getOpponentSocketId returns the other player", () => {
      const { roomCode } = rm.createRoom("sock1", "Alice");
      rm.joinRoom(roomCode, "sock2", "Bob");
      expect(rm.getOpponentSocketId(roomCode, "sock1")).toBe("sock2");
      expect(rm.getOpponentSocketId(roomCode, "sock2")).toBe("sock1");
    });

    it("getPlayerNickname resolves nickname", () => {
      rm.createRoom("sock1", "Alice");
      expect(rm.getPlayerNickname("sock1")).toBe("Alice");
      expect(rm.getPlayerNickname("unknown")).toBe("Unknown");
    });

    it("getRoomByPlayer finds room via socket", () => {
      const { roomCode } = rm.createRoom("sock1", "Alice");
      expect(rm.getRoomByPlayer("sock1")?.code).toBe(roomCode);
    });
  });

  describe("handleDisconnect", () => {
    it("removes player and keeps room if one remains", () => {
      const { roomCode } = rm.createRoom("sock1", "Alice");
      rm.joinRoom(roomCode, "sock2", "Bob");
      rm.handleDisconnect("sock1");
      const room = rm.getRoom(roomCode)!;
      expect(room.players).toHaveLength(1);
      expect(room.players[0].id).toBe("sock2");
    });

    it("deletes room when last player leaves", () => {
      const { roomCode } = rm.createRoom("sock1", "Alice");
      rm.handleDisconnect("sock1");
      expect(rm.getRoom(roomCode)).toBeUndefined();
    });
  });
});
