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
  isReady: boolean;
  socketId: string;
}

export interface Room {
  code: string;
  players: Player[];
  createdAt: number;
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

export interface GameOverRound {
  roundNumber: number;
  song: Song;
  correct: boolean;
  score: number;
  guesserId: string;
  guesserNickname: string;
  timeTaken: number;
}

export interface GameOverData {
  winner: { id: string; nickname: string } | null;
  scores: ScoreEntry[];
  rounds: GameOverRound[];
}

export type GamePhase = "lobby" | "countdown" | "transition" | "playing" | "result" | "game_over";

export type PlayerRole = "hummer" | "guesser";

export interface GameState {
  phase: GamePhase;
  myRole: PlayerRole;
  currentRound: number;
  totalRounds: number;
  currentSong: Song | null;
  options: Song[];
  scores: ScoreEntry[];
  timeLeft: number;
  comboCount: number;
}
