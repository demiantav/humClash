import { create } from "zustand";

interface RoomState {
  roomCode: string | null;
  nickname: string | null;
  isReady: boolean;
  players: { id: string; nickname: string; isReady: boolean }[];
  setRoom: (code: string) => void;
  setNickname: (name: string) => void;
  setReady: (ready: boolean) => void;
  setPlayers: (players: { id: string; nickname: string; isReady: boolean }[]) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomCode: null,
  nickname: null,
  isReady: false,
  players: [],
  setRoom: (code) => set({ roomCode: code }),
  setNickname: (name) => set({ nickname: name }),
  setReady: (ready) => set({ isReady: ready }),
  setPlayers: (players) => set({ players }),
  reset: () => set({ roomCode: null, nickname: null, isReady: false, players: [] }),
}));
