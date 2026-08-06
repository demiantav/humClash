import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GameSession } from "./GameSession.js";
import { TurnManager } from "./TurnManager.js";
import { storeClip, deleteClipsForRoom } from "../storage/clipStore.js";

type Emitted = { target: "all" | string; event: string; data: any };

function createSession(overrides?: {
  humTimeLimit?: number;
  guessTimeLimit?: number;
}) {
  const emissions: Emitted[] = [];
  const turnManager = new TurnManager();

  const session = new GameSession(
    "ROOM01",
    [
      { id: "p1", nickname: "Alice" },
      { id: "p2", nickname: "Bob" },
    ],
    turnManager,
    (event, data) => emissions.push({ target: "all", event, data }),
    (playerId, event, data) => emissions.push({ target: playerId, event, data }),
  );

  if (overrides?.humTimeLimit != null) session.humTimeLimit = overrides.humTimeLimit;
  if (overrides?.guessTimeLimit != null) session.guessTimeLimit = overrides.guessTimeLimit;

  return { session, emissions, turnManager };
}

function findAll(emissions: Emitted[], event: string, target?: string) {
  return emissions.filter(
    (e) => e.event === event && (target === undefined || e.target === target),
  );
}

function reachActiveRound(session: GameSession) {
  session.startCountdown();
  vi.advanceTimersByTime(4000);
}

function uploadFakeClip(session: GameSession, hummerId: string) {
  const clip = storeClip("ROOM01", Buffer.from("fake-audio"), "audio/m4a");
  const ok = session.onClipUploaded(hummerId, clip.id, `http://test/clips/${clip.id}`);
  return { ok, clip };
}

describe("GameSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    deleteClipsForRoom("ROOM01");
  });

  afterEach(() => {
    deleteClipsForRoom("ROOM01");
    vi.useRealTimers();
  });

  it("startCountdown emits game_starting and countdown ticks then new_round", () => {
    const { session, emissions } = createSession();
    session.startCountdown();
    expect(findAll(emissions, "game_starting")).toHaveLength(1);

    vi.advanceTimersByTime(4000);

    const rounds = findAll(emissions, "new_round");
    expect(rounds).toHaveLength(2);
    expect(rounds.some((e) => e.data.yourRole === "hummer")).toBe(true);
    expect(rounds.some((e) => e.data.yourRole === "guesser")).toBe(true);
    expect(findAll(emissions, "agora_token")).toHaveLength(0);
  });

  it("onClipUploaded starts guess phase with clip_ready", () => {
    const { session, emissions } = createSession();
    reachActiveRound(session);
    emissions.length = 0;

    const hummerId = session.getHummerId();
    const { ok } = uploadFakeClip(session, hummerId);
    expect(ok).toBe(true);

    const ready = findAll(emissions, "clip_ready");
    expect(ready).toHaveLength(1);
    expect(ready[0].data.clipUrl).toContain("/clips/");
    expect(findAll(emissions, "humming_started")).toHaveLength(1);

    vi.advanceTimersByTime(1000);
    expect(findAll(emissions, "timer_sync").length).toBeGreaterThan(0);
  });

  it("rejects clip from non-hummer", () => {
    const { session } = createSession();
    reachActiveRound(session);
    const guesserId = session.getGuesserId();
    const { ok } = uploadFakeClip(session, guesserId);
    expect(ok).toBe(false);
  });

  it("handleGuess scores and emits round_result", () => {
    const { session, emissions } = createSession();
    reachActiveRound(session);
    uploadFakeClip(session, session.getHummerId());
    emissions.length = 0;

    const round = session.getCurrentRound()!;
    const result = session.handleGuess(round.song.id, session.getGuesserId());
    expect(result?.correct).toBe(true);
    expect(findAll(emissions, "round_result")[0].data.correct).toBe(true);
  });

  it("handleTimeout during guess emits round_result", () => {
    const { session, emissions } = createSession({ guessTimeLimit: 2 });
    reachActiveRound(session);
    uploadFakeClip(session, session.getHummerId());
    emissions.length = 0;

    vi.advanceTimersByTime(3000);
    expect(findAll(emissions, "round_result").length).toBeGreaterThanOrEqual(1);
  });

  it("finishes after 5 scored rounds", () => {
    const { session, emissions } = createSession();
    session.startCountdown();
    vi.advanceTimersByTime(4000);

    for (let i = 0; i < 5; i++) {
      expect(session.phase).toBe("round_active");
      uploadFakeClip(session, session.getHummerId());
      const songId = session.getCurrentRound()!.song.id;
      session.handleGuess(songId, session.getGuesserId());
      expect(session.phase).toBe("round_result");
      session.advanceRound();
      if (i < 4) {
        expect(session.phase).toBe("countdown");
        vi.advanceTimersByTime(4000);
      }
    }

    expect(session.phase).toBe("game_over");
    expect(findAll(emissions, "game_over").length).toBeGreaterThanOrEqual(1);
  });
});
