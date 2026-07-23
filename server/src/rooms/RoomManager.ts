import { Room, Player, RoomMap } from "./types.js";

export class RoomManager {
  private rooms: RoomMap = new Map();
  private playerRooms: Map<string, string> = new Map();

  private generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (this.rooms.has(code)) return this.generateCode();
    return code;
  }

  createRoom(socketId: string, nickname: string): { roomCode: string } {
    const code = this.generateCode();
    const player: Player = { id: socketId, nickname, isReady: false, socketId };
    const room: Room = { code, players: [player], createdAt: Date.now() };
    this.rooms.set(code, room);
    this.playerRooms.set(socketId, code);
    return { roomCode: code };
  }

  joinRoom(code: string, socketId: string, nickname: string): Room {
    const room = this.rooms.get(code);
    if (!room) throw new Error("room_not_found");
    if (room.players.length >= 2) throw new Error("room_full");
    const alreadyInRoom = room.players.find((p) => p.id === socketId);
    if (alreadyInRoom) return room;
    const player: Player = { id: socketId, nickname, isReady: false, socketId };
    room.players.push(player);
    this.playerRooms.set(socketId, code);
    return room;
  }

  setPlayerReady(socketId: string): Room | null {
    const code = this.playerRooms.get(socketId);
    if (!code) return null;
    const room = this.rooms.get(code);
    if (!room) return null;
    const player = room.players.find((p) => p.id === socketId);
    if (player) player.isReady = !player.isReady;
    return room;
  }

  areAllPlayersReady(code: string): boolean {
    const room = this.rooms.get(code);
    if (!room || room.players.length < 2) return false;
    return room.players.every((p) => p.isReady);
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  getRoomByPlayer(socketId: string): Room | undefined {
    const code = this.playerRooms.get(socketId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  getOpponentSocketId(code: string, playerId: string): string | undefined {
    const room = this.rooms.get(code);
    if (!room) return undefined;
    const opponent = room.players.find((p) => p.id !== playerId);
    return opponent?.socketId;
  }

  getPlayerNickname(socketId: string): string {
    const code = this.playerRooms.get(socketId);
    if (!code) return "Unknown";
    const room = this.rooms.get(code);
    if (!room) return "Unknown";
    const player = room.players.find((p) => p.id === socketId);
    return player?.nickname || "Unknown";
  }

  handleDisconnect(socketId: string): void {
    const code = this.playerRooms.get(socketId);
    if (code) {
      const room = this.rooms.get(code);
      if (room) {
        room.players = room.players.filter((p) => p.id !== socketId);
        if (room.players.length === 0) {
          this.rooms.delete(code);
          console.log(`[room] ${code} — deleted (empty)`);
        }
      }
      this.playerRooms.delete(socketId);
    }
  }

  getPlayerIds(code: string): string[] {
    const room = this.rooms.get(code);
    if (!room) return [];
    return room.players.map((p) => p.id);
  }
}
