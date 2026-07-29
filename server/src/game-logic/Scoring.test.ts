import { describe, it, expect } from "vitest";
import { calculateScore, computeFinalScores } from "./Scoring.js";
import type { RoundResult } from "./types.js";

describe("calculateScore", () => {
  it("returns 0 when incorrect", () => {
    expect(calculateScore(false, 1, 15)).toBe(0);
    expect(calculateScore(false, 0, 15)).toBe(0);
  });

  it("returns 500 when ratio > 0.9", () => {
    // 1s / 15s → ratio ≈ 0.933
    expect(calculateScore(true, 1, 15)).toBe(500);
    expect(calculateScore(true, 0, 15)).toBe(500);
  });

  it("returns 400 when ratio > 0.7 and ≤ 0.9", () => {
    // 3s / 15s → 0.8
    expect(calculateScore(true, 3, 15)).toBe(400);
    // boundary: ratio === 0.9 exactly uses > 0.9 → 400
    expect(calculateScore(true, 1.5, 15)).toBe(400);
  });

  it("returns 300 when ratio > 0.4 and ≤ 0.7", () => {
    // 6s / 15s → 0.6
    expect(calculateScore(true, 6, 15)).toBe(300);
    // 4.5s / 15s → 0.7 exactly → not > 0.7 → 300
    expect(calculateScore(true, 4.5, 15)).toBe(300);
  });

  it("returns 200 when ratio > 0.2 and ≤ 0.4", () => {
    // 10s / 15s → ≈0.333
    expect(calculateScore(true, 10, 15)).toBe(200);
  });

  it("returns 100 when ratio ≤ 0.2", () => {
    // 12s / 15s → 0.2 exactly
    expect(calculateScore(true, 12, 15)).toBe(100);
    expect(calculateScore(true, 14, 15)).toBe(100);
    expect(calculateScore(true, 15, 15)).toBe(100);
  });

  it("clamps negative ratio via Math.max(0, ...)", () => {
    expect(calculateScore(true, 20, 15)).toBe(100);
  });
});

describe("computeFinalScores", () => {
  const players = [
    { id: "p1", nickname: "Alice" },
    { id: "p2", nickname: "Bob" },
  ];

  function round(
    partial: Partial<RoundResult> & Pick<RoundResult, "guesserId" | "score">,
  ): RoundResult {
    return {
      roundNumber: 1,
      song: {
        id: "s01",
        title: "T",
        artist: "A",
        genre: "rock",
        difficulty: "easy",
        decade: "90s",
        hint: "h",
      },
      hummerId: partial.guesserId === "p1" ? "p2" : "p1",
      guess: null,
      correct: partial.score > 0,
      timeTaken: 1,
      ...partial,
    };
  }

  it("returns zeroed entries when no rounds", () => {
    const scores = computeFinalScores([], players);
    expect(scores).toHaveLength(2);
    expect(scores.every((s) => s.totalScore === 0)).toBe(true);
    expect(scores.every((s) => s.roundScores.length === 0)).toBe(true);
  });

  it("sums scores only for the guesser of each round", () => {
    const rounds = [
      round({ guesserId: "p1", score: 500, roundNumber: 1 }),
      round({ guesserId: "p2", score: 300, roundNumber: 2 }),
      round({ guesserId: "p1", score: 400, roundNumber: 3 }),
    ];
    const scores = computeFinalScores(rounds, players);
    const alice = scores.find((s) => s.playerId === "p1")!;
    const bob = scores.find((s) => s.playerId === "p2")!;
    expect(alice.totalScore).toBe(900);
    expect(alice.roundScores).toEqual([500, 400]);
    expect(bob.totalScore).toBe(300);
    expect(bob.roundScores).toEqual([300]);
  });

  it("sorts by totalScore descending", () => {
    const rounds = [
      round({ guesserId: "p2", score: 500, roundNumber: 1 }),
      round({ guesserId: "p1", score: 100, roundNumber: 2 }),
    ];
    const scores = computeFinalScores(rounds, players);
    expect(scores[0].playerId).toBe("p2");
    expect(scores[0].totalScore).toBe(500);
    expect(scores[1].playerId).toBe("p1");
  });

  it("handles five mixed rounds", () => {
    const rounds = [
      round({ guesserId: "p1", score: 500, roundNumber: 1 }),
      round({ guesserId: "p2", score: 0, roundNumber: 2 }),
      round({ guesserId: "p1", score: 300, roundNumber: 3 }),
      round({ guesserId: "p2", score: 400, roundNumber: 4 }),
      round({ guesserId: "p1", score: 200, roundNumber: 5 }),
    ];
    const scores = computeFinalScores(rounds, players);
    const alice = scores.find((s) => s.playerId === "p1")!;
    const bob = scores.find((s) => s.playerId === "p2")!;
    expect(alice.totalScore).toBe(1000);
    expect(bob.totalScore).toBe(400);
    expect(scores[0].playerId).toBe("p1");
  });
});
