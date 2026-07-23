export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: "reggaeton" | "rock" | "cumbia" | "pop_latino" | "balada" | "clasico";
  difficulty: "easy" | "medium" | "hard";
  decade: string;
  hint: string;
}

export interface Player {
  id: string;
  nickname: string;
  socketId: string;
}

export interface ScoreEntry {
  playerId: string;
  nickname: string;
  roundScores: number[];
  totalScore: number;
}

export interface RoundResult {
  roundNumber: number;
  song: Song;
  hummerId: string;
  guesserId: string;
  guess: string | null;
  correct: boolean;
  timeTaken: number;
  score: number;
}

export type GamePhase = "lobby" | "countdown" | "round_active" | "round_result" | "game_over";

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  scores: ScoreEntry[];
  rounds: RoundResult[];
  timeLimit: number;
}
