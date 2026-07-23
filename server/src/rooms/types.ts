export interface Player {
  id: string;
  nickname: string;
  isReady: boolean;
  socketId: string;
}

export interface Room {
  code: string;
  players: Player[];
  createdAt: number;
}

export type RoomMap = Map<string, Room>;
