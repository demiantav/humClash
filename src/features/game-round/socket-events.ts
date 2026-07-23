import { Song, ScoreEntry, RoundResult } from "../../shared/types";

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

export interface GameOverData {
  winner: { id: string; nickname: string } | null;
  scores: ScoreEntry[];
  rounds: {
    roundNumber: number;
    song: Song;
    correct: boolean;
    score: number;
    guesserId: string;
    guesserNickname: string;
    timeTaken: number;
  }[];
}
