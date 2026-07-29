import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./useGameStore";

describe("useGameStore", () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it("has expected initial state", () => {
    const s = useGameStore.getState();
    expect(s.phase).toBe("lobby");
    expect(s.myRole).toBe("guesser");
    expect(s.currentRound).toBe(0);
    expect(s.totalRounds).toBe(5);
    expect(s.comboCount).toBe(0);
    expect(s.currentSong).toBeNull();
    expect(s.options).toEqual([]);
    expect(s.timeLeft).toBe(0);
    expect(s.timeLimit).toBe(0);
  });

  it("incrementCombo and resetCombo", () => {
    useGameStore.getState().incrementCombo();
    useGameStore.getState().incrementCombo();
    expect(useGameStore.getState().comboCount).toBe(2);
    useGameStore.getState().resetCombo();
    expect(useGameStore.getState().comboCount).toBe(0);
  });

  it("reset clears combo, song, options and timer", () => {
    const s = useGameStore.getState();
    s.setMyRole("hummer");
    s.setRound(3);
    s.incrementCombo();
    s.setTimeLeft(10);
    s.setTimeLimit(15);
    s.setServerTimestamp(99);
    s.setCurrentSong({
      id: "s01",
      title: "T",
      artist: "A",
      genre: "rock",
      difficulty: "easy",
      decade: "90s",
      hint: "h",
    });
    s.setOptions([
      {
        id: "s02",
        title: "U",
        artist: "B",
        genre: "rock",
        difficulty: "easy",
        decade: "90s",
        hint: "h",
      },
    ]);

    s.reset();
    const next = useGameStore.getState();
    expect(next.phase).toBe("lobby");
    expect(next.myRole).toBe("guesser");
    expect(next.currentRound).toBe(0);
    expect(next.comboCount).toBe(0);
    expect(next.currentSong).toBeNull();
    expect(next.options).toEqual([]);
    expect(next.timeLeft).toBe(0);
    expect(next.timeLimit).toBe(0);
    expect(next.serverTimestamp).toBe(0);
  });

  it("setters update role, round, timer fields", () => {
    const s = useGameStore.getState();
    s.setMyRole("hummer");
    s.setRound(3);
    s.setTimeLeft(10);
    s.setTimeLimit(15);
    s.setServerTimestamp(12345);

    const next = useGameStore.getState();
    expect(next.myRole).toBe("hummer");
    expect(next.currentRound).toBe(3);
    expect(next.timeLeft).toBe(10);
    expect(next.timeLimit).toBe(15);
    expect(next.serverTimestamp).toBe(12345);
  });
});
