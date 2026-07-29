import { Song, ScoreEntry, GameOverData } from "../../shared/types";

export type { GameOverData };

export interface NewRoundData {
  roundNumber: number;
  song: Song | null;
  options: Song[];
  yourRole: "hummer" | "guesser";
  timeLimit: number;
  totalRounds: number;
  opponentNickname: string;
}

export interface TimerSyncData {
  secondsElapsed: number;
  timeLimit: number;
  serverTimestamp: number;
}

export interface RoundResultData {
  roundNumber: number;
  correct: boolean;
  song: Song;
  score: number;
  timeTaken: number;
  timeout?: boolean;
  scores: ScoreEntry[];
  guesserId: string;
}
