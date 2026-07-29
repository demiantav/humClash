import { describe, it, expect, vi, afterEach } from "vitest";
import { estimateElapsed, calculateTimeRatio } from "./timerSync";

describe("estimateElapsed", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds network delta from serverTimestamp", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    // server said 5s elapsed at t=999_000 → 1s ago
    expect(estimateElapsed(5, 999_000)).toBeCloseTo(6, 5);
  });

  it("never returns negative", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    // server timestamp in the future
    expect(estimateElapsed(0, 1_500_000)).toBe(0);
  });
});

describe("calculateTimeRatio", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("clamps to [0, 1]", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);

    expect(calculateTimeRatio(0, 1_000_000, 15)).toBe(0);
    expect(calculateTimeRatio(15, 1_000_000, 15)).toBe(1);
    expect(calculateTimeRatio(20, 1_000_000, 15)).toBe(1);
  });

  it("returns mid ratio for half elapsed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    expect(calculateTimeRatio(7.5, 1_000_000, 15)).toBeCloseTo(0.5, 5);
  });
});
