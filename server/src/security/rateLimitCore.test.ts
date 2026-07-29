import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, clearRateLimitState, RATE_LIMITS } from "./rateLimitCore.js";

describe("checkRateLimit", () => {
  beforeEach(() => {
    clearRateLimitState();
  });

  it("allows unknown events without counting", () => {
    for (let i = 0; i < 100; i++) {
      expect(checkRateLimit("1.1.1.1", "ping", 1000 + i).allowed).toBe(true);
    }
  });

  it("allows requests under the max", () => {
    const now = 1_000_000;
    expect(checkRateLimit("ip", "create_room", now).allowed).toBe(true);
    expect(checkRateLimit("ip", "create_room", now + 1).allowed).toBe(true);
    expect(checkRateLimit("ip", "create_room", now + 2).allowed).toBe(true);
  });

  it("blocks when max is reached and sets 30s block", () => {
    const now = 1_000_000;
    const max = RATE_LIMITS.create_room.max;
    for (let i = 0; i < max; i++) {
      expect(checkRateLimit("ip", "create_room", now + i).allowed).toBe(true);
    }
    const blocked = checkRateLimit("ip", "create_room", now + max);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.error).toContain("30s");
    }
  });

  it("rejects during block window with remaining seconds", () => {
    const now = 1_000_000;
    const max = RATE_LIMITS.create_room.max;
    for (let i = 0; i < max; i++) {
      checkRateLimit("ip", "create_room", now + i);
    }
    checkRateLimit("ip", "create_room", now + max); // triggers block

    const during = checkRateLimit("ip", "create_room", now + max + 5_000);
    expect(during.allowed).toBe(false);
    if (!during.allowed) {
      expect(during.error).toMatch(/Esperá \d+s/);
    }
  });

  it("allows again after block expires", () => {
    const now = 1_000_000;
    const max = RATE_LIMITS.create_room.max;
    for (let i = 0; i < max; i++) {
      checkRateLimit("ip", "create_room", now + i);
    }
    checkRateLimit("ip", "create_room", now + max);

    const after = checkRateLimit("ip", "create_room", now + max + 31_000);
    expect(after.allowed).toBe(true);
  });

  it("does not mix different event types", () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMITS.create_room.max; i++) {
      checkRateLimit("ip", "create_room", now + i);
    }
    // join_room should still be allowed
    expect(checkRateLimit("ip", "join_room", now).allowed).toBe(true);
  });

  it("isolates limits per IP", () => {
    const now = 1_000_000;
    for (let i = 0; i < RATE_LIMITS.create_room.max; i++) {
      checkRateLimit("ip-a", "create_room", now + i);
    }
    checkRateLimit("ip-a", "create_room", now + 10); // block ip-a

    expect(checkRateLimit("ip-b", "create_room", now).allowed).toBe(true);
  });

  it("expires timestamps outside the window", () => {
    const now = 1_000_000;
    const windowMs = RATE_LIMITS.create_room.windowMs;
    // Fill to max-1 at t=now
    for (let i = 0; i < RATE_LIMITS.create_room.max - 1; i++) {
      checkRateLimit("ip", "create_room", now + i);
    }
    // Far in the future, old timestamps expired → still allowed full quota
    const later = now + windowMs + 1;
    for (let i = 0; i < RATE_LIMITS.create_room.max; i++) {
      expect(checkRateLimit("ip", "create_room", later + i).allowed).toBe(true);
    }
  });
});
