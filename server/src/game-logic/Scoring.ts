import { ScoreEntry, RoundResult } from "./types.js";

export function calculateScore(correct: boolean, secondsTaken: number, timeLimit: number): number {
  if (!correct) return 0;
  const ratio = Math.max(0, 1 - secondsTaken / timeLimit);
  if (ratio > 0.9) return 500;
  if (ratio > 0.7) return 400;
  if (ratio > 0.4) return 300;
  if (ratio > 0.2) return 200;
  return 100;
}

export function computeFinalScores(rounds: RoundResult[], players: { id: string; nickname: string }[]): ScoreEntry[] {
  const scores: ScoreEntry[] = players.map((p) => ({
    playerId: p.id,
    nickname: p.nickname,
    roundScores: [],
    totalScore: 0,
  }));

  for (const round of rounds) {
    const guesserEntry = scores.find((s) => s.playerId === round.guesserId);
    if (guesserEntry) {
      guesserEntry.roundScores.push(round.score);
      guesserEntry.totalScore += round.score;
    }
  }

  return scores.sort((a, b) => b.totalScore - a.totalScore);
}
