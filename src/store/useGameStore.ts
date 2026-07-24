import { create } from "zustand";
import { GamePhase, PlayerRole, Song, ScoreEntry } from "../shared/types";

interface GameState {
  phase: GamePhase;
  myRole: PlayerRole;
  currentRound: number;
  totalRounds: number;
  currentSong: Song | null;
  options: Song[];
  scores: ScoreEntry[];
  timeLeft: number;
  timeLimit: number;
  serverTimestamp: number;
  comboCount: number;
  setPhase: (phase: GamePhase) => void;
  setMyRole: (role: PlayerRole) => void;
  setRound: (round: number) => void;
  setCurrentSong: (song: Song | null) => void;
  setOptions: (options: Song[]) => void;
  setScores: (scores: ScoreEntry[]) => void;
  setTimeLeft: (time: number) => void;
  setTimeLimit: (limit: number) => void;
  setServerTimestamp: (ts: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  phase: "lobby",
  myRole: "guesser",
  currentRound: 0,
  totalRounds: 5,
  currentSong: null,
  options: [],
  scores: [],
  timeLeft: 0,
  timeLimit: 0,
  serverTimestamp: 0,
  comboCount: 0,
  setPhase: (phase) => set({ phase }),
  setMyRole: (role) => set({ myRole: role }),
  setRound: (round) => set({ currentRound: round }),
  setCurrentSong: (song) => set({ currentSong: song }),
  setOptions: (options) => set({ options }),
  setScores: (scores) => set({ scores }),
  setTimeLeft: (time) => set({ timeLeft: time }),
  setTimeLimit: (limit) => set({ timeLimit: limit }),
  setServerTimestamp: (ts) => set({ serverTimestamp: ts }),
  incrementCombo: () => set((state) => ({ comboCount: state.comboCount + 1 })),
  resetCombo: () => set({ comboCount: 0 }),
  reset: () =>
    set({
      phase: "lobby",
      myRole: "guesser",
      currentRound: 0,
      totalRounds: 5,
      currentSong: null,
      options: [],
      scores: [],
      timeLeft: 0,
      timeLimit: 0,
      serverTimestamp: 0,
      comboCount: 0,
    }),
}));
