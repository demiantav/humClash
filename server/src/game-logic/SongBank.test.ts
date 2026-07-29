import { describe, it, expect } from "vitest";
import { SONGS, pickRoundSongs } from "./SongBank.js";

describe("SONGS bank", () => {
  it("has exactly 30 songs", () => {
    expect(SONGS).toHaveLength(30);
  });

  it("has difficulty distribution 10 easy / 12 medium / 8 hard", () => {
    const easy = SONGS.filter((s) => s.difficulty === "easy");
    const medium = SONGS.filter((s) => s.difficulty === "medium");
    const hard = SONGS.filter((s) => s.difficulty === "hard");
    expect(easy).toHaveLength(10);
    expect(medium).toHaveLength(12);
    expect(hard).toHaveLength(8);
  });

  it("every song has required fields and non-empty hint", () => {
    for (const song of SONGS) {
      expect(song.id).toBeTruthy();
      expect(song.title.length).toBeGreaterThan(0);
      expect(song.artist.length).toBeGreaterThan(0);
      expect(song.hint.length).toBeGreaterThan(0);
      expect(["reggaeton", "rock", "cumbia", "pop_latino", "balada", "clasico"]).toContain(
        song.genre,
      );
    }
  });

  it("has unique ids", () => {
    const ids = SONGS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("pickRoundSongs", () => {
  it("returns 1 correct + 3 distractors", () => {
    const { correct, distractors } = pickRoundSongs();
    expect(correct).toBeDefined();
    expect(distractors).toHaveLength(3);
  });

  it("distractors never include the correct song", () => {
    for (let i = 0; i < 20; i++) {
      const { correct, distractors } = pickRoundSongs();
      expect(distractors.every((d) => d.id !== correct.id)).toBe(true);
    }
  });

  it("respects excludeSongIds", () => {
    const exclude = SONGS.slice(0, 10).map((s) => s.id);
    for (let i = 0; i < 15; i++) {
      const { correct, distractors } = pickRoundSongs(exclude);
      expect(exclude).not.toContain(correct.id);
      for (const d of distractors) {
        expect(exclude).not.toContain(d.id);
      }
    }
  });

  it("prefers same-genre distractors when available", () => {
    let sameGenreHits = 0;
    for (let i = 0; i < 30; i++) {
      const { correct, distractors } = pickRoundSongs();
      const same = distractors.filter((d) => d.genre === correct.genre).length;
      if (same >= 1) sameGenreHits++;
    }
    // With 30 songs and genre clustering, should hit often
    expect(sameGenreHits).toBeGreaterThan(10);
  });

  it("still returns songs when almost all excluded", () => {
    const exclude = SONGS.slice(0, 26).map((s) => s.id);
    const { correct, distractors } = pickRoundSongs(exclude);
    expect(correct).toBeDefined();
    // May have fewer than 3 distractors if pool is tiny
    expect(distractors.length).toBeGreaterThanOrEqual(1);
    expect(distractors.length).toBeLessThanOrEqual(3);
  });
});
