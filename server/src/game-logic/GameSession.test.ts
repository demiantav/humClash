import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { GameSession } from "./GameSession.js";
import { TurnManager } from "./TurnManager.js";

type Emitted = { target: "all" | string; event: string; data: any };

function createSession(overrides?: {
  humTimeLimit?: number;
  guessTimeLimit?: number;
}) {
  const emissions: Emitted[] = [];
  const turnManager = new TurnManager();
  const tokens: Array<{ uid: number; role: string }> = [];

  const session = new GameSession(
    "ROOM01",
    [
      { id: "p1", nickname: "Alice" },
      { id: "p2", nickname: "Bob" },
    ],
    turnManager,
    (event, data) => emissions.push({ target: "all", event, data }),
    (playerId, event, data) => emissions.push({ target: playerId, event, data }),
    (_channel, uid, role) => {
      tokens.push({ uid, role });
      return { token: `tok-${uid}-${role}`, appId: "test-app" };
    },
  );

  if (overrides?.humTimeLimit != null) session.humTimeLimit = overrides.humTimeLimit;
  if (overrides?.guessTimeLimit != null) session.guessTimeLimit = overrides.guessTimeLimit;

  return { session, emissions, turnManager, tokens };
}

function findAll(emissions: Emitted[], event: string, target?: string) {
  return emissions.filter(
    (e) => e.event === event && (target === undefined || e.target === target),
  );
}

describe("GameSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("startCountdown emits game_starting and ticks then starts round", () => {
    const { session, emissions } = createSession();
    session.startCountdown();

    expect(findAll(emissions, "game_starting")).toHaveLength(1);
    expect(session.phase).toBe("countdown");

    vi.advanceTimersByTime(1000);
    expect(findAll(emissions, "countdown_tick").at(-1)?.data.count).toBe(3);
    vi.advanceTimersByTime(1000);
    expect(findAll(emissions, "countdown_tick").at(-1)?.data.count).toBe(2);
    vi.advanceTimersByTime(1000);
    expect(findAll(emissions, "countdown_tick").at(-1)?.data.count).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(findAll(emissions, "countdown_tick").at(-1)?.data.count).toBe(0);

    // after count < 0 → startRound
    expect(session.phase).toBe("round_active");
    expect(session.currentRound).toBe(1);
  });

  it("round 1: p1 hummer, p2 guesser with correct payloads", () => {
    const { session, emissions, tokens } = createSession();
    session.startCountdown();
    vi.advanceTimersByTime(4000);

    const hummerRound = findAll(emissions, "new_round", "p1")[0];
    const guesserRound = findAll(emissions, "new_round", "p2")[0];

    expect(hummerRound.data.yourRole).toBe("hummer");
    expect(hummerRound.data.song).not.toBeNull();
    expect(hummerRound.data.options).toEqual([]);
    expect(hummerRound.data.timeLimit).toBe(20);

    expect(guesserRound.data.yourRole).toBe("guesser");
    expect(guesserRound.data.song).toBeNull();
    expect(guesserRound.data.options).toHaveLength(4);
    expect(guesserRound.data.timeLimit).toBe(15);

    expect(tokens).toEqual(
      expect.arrayContaining([
        { uid: 1, role: "publisher" },
        { uid: 2, role: "subscriber" },
      ]),
    );
  });

  it("round 2: roles swap (p2 hummer)", () => {
    const { session, emissions } = createSession();
    session.startCountdown();
    vi.advanceTimersByTime(4000);

    const songId = findAll(emissions, "new_round", "p1")[0].data.song.id;
    session.startGuessing();
    session.handleGuess(songId, "p2");
    session.advanceRound();
    vi.advanceTimersByTime(4000);

    const hummerR2 = findAll(emissions, "new_round", "p2").at(-1)!;
    const guesserR2 = findAll(emissions, "new_round", "p1").at(-1)!;
    expect(hummerR2.data.yourRole).toBe("hummer");
    expect(guesserR2.data.yourRole).toBe("guesser");
    expect(session.currentRound).toBe(2);
  });

  it("startGuessing emits humming_started and timer_sync", () => {
    const { session, emissions } = createSession();
    session.startCountdown();
    vi.advanceTimersByTime(4000);
    emissions.length = 0;

    session.startGuessing();
    expect(findAll(emissions, "humming_started", "p2")).toHaveLength(1);

    vi.advanceTimersByTime(1000);
    const sync = findAll(emissions, "timer_sync")[0];
    expect(sync.data.secondsElapsed).toBe(1);
    expect(sync.data.timeLimit).toBe(15);
    expect(typeof sync.data.serverTimestamp).toBe("number");
  });

  it("handleGuess correct awards score and moves to round_result", () => {
    const { session, emissions } = createSession();
    session.startCountdown();
    vi.advanceTimersByTime(4000);
    const songId = findAll(emissions, "new_round", "p1")[0].data.song.id;
    session.startGuessing();
    emissions.length = 0;

    const result = session.handleGuess(songId, "p2");
    expect(result?.correct).toBe(true);
    expect(result!.score).toBeGreaterThan(0);
    expect(session.phase).toBe("round_result");

    const rr = findAll(emissions, "round_result")[0];
    expect(rr.data.correct).toBe(true);
    expect(rr.data.scores).toHaveLength(2);
  });

  it("handleGuess incorrect awards 0", () => {
    const { session, emissions } = createSession();
    session.startCountdown();
    vi.advanceTimersByTime(4000);
    const options = findAll(emissions, "new_round", "p2")[0].data.options;
    const songId = findAll(emissions, "new_round", "p1")[0].data.song.id;
    const wrong = options.find((o: { id: string }) => o.id !== songId)!.id;
    session.startGuessing();

    const result = session.handleGuess(wrong, "p2");
    expect(result?.correct).toBe(false);
    expect(result?.score).toBe(0);
  });

  it("ignores guess from non-guesser or double guess", () => {
    const { session, emissions } = createSession();
    session.startCountdown();
    vi.advanceTimersByTime(4000);
    const songId = findAll(emissions, "new_round", "p1")[0].data.song.id;
    session.startGuessing();

    expect(session.handleGuess(songId, "p1")).toBeNull();
    expect(session.handleGuess(songId, "p2")).not.toBeNull();
    expect(session.handleGuess(songId, "p2")).toBeNull();
  });

  it("handleTimeout marks incorrect with score 0", () => {
    const { session, emissions } = createSession({ guessTimeLimit: 2 });
    session.startCountdown();
    vi.advanceTimersByTime(4000);
    session.startGuessing();
    emissions.length = 0;

    vi.advanceTimersByTime(2000);
    expect(session.phase).toBe("round_result");
    const rr = findAll(emissions, "round_result")[0];
    expect(rr.data.correct).toBe(false);
    expect(rr.data.score).toBe(0);
    expect(rr.data.timeout).toBe(true);
  });

  it("completes 5 rounds then finishGame emits game_over with winner", () => {
    const { session, emissions } = createSession();

    session.startCountdown();
    vi.advanceTimersByTime(4000);

    for (let r = 0; r < 5; r++) {
      const hummerId = session.getHummerId();
      const guesserId = session.getGuesserId();
      const songId = findAll(emissions, "new_round", hummerId).at(-1)!.data.song.id;
      session.startGuessing();
      session.handleGuess(songId, guesserId);
      if (r < 4) {
        session.advanceRound();
        vi.advanceTimersByTime(4000);
      }
    }

    session.advanceRound();
    expect(session.phase).toBe("game_over");
    const go = findAll(emissions, "game_over")[0];
    expect(go.data.rounds).toHaveLength(5);
    expect(go.data.scores).toHaveLength(2);
    expect(go.data.winner).not.toBeNull();
  });

  it("rematch requires both players then restarts", () => {
    const { session, emissions } = createSession();
    session.startCountdown();
    vi.advanceTimersByTime(4000);
    // force game over quickly
    session.phase = "game_over";
    session.currentRound = 5;
    (session as any).rounds = Array.from({ length: 5 }, (_, i) => ({
      roundNumber: i + 1,
      song: { id: `s${i}`, title: "t", artist: "a", genre: "rock", difficulty: "easy", decade: "90s", hint: "h" },
      hummerId: "p1",
      guesserId: "p2",
      guess: "s",
      correct: true,
      timeTaken: 1,
      score: 500,
    }));

    const r1 = session.requestRematch("p1");
    expect(r1.bothWant).toBe(false);
    expect(findAll(emissions, "rematch_requested", "p2")).toHaveLength(1);

    const r2 = session.requestRematch("p2");
    expect(r2.bothWant).toBe(true);
    expect(findAll(emissions, "rematch_accepted")).toHaveLength(1);

    vi.advanceTimersByTime(1000);
    expect(session.phase).toBe("countdown");
    expect(session.currentRound).toBe(0);
  });

  it("requestRehum only from guesser notifies hummer", () => {
    const { session, emissions } = createSession();
    session.startCountdown();
    vi.advanceTimersByTime(4000);
    emissions.length = 0;

    session.requestRehum("p1"); // hummer — ignored
    expect(findAll(emissions, "rehum_requested")).toHaveLength(0);

    session.requestRehum("p2");
    expect(findAll(emissions, "rehum_requested", "p1")).toHaveLength(1);
  });

  it("does not repeat songs across rounds in a match", () => {
    const { session, emissions } = createSession();
    const used = new Set<string>();

    session.startCountdown();
    vi.advanceTimersByTime(4000);

    for (let r = 0; r < 5; r++) {
      const hummerId = session.getHummerId();
      const songId = findAll(emissions, "new_round", hummerId).at(-1)!.data.song.id;
      expect(used.has(songId)).toBe(false);
      used.add(songId);
      session.startGuessing();
      session.handleGuess(songId, session.getGuesserId());
      if (r < 4) {
        session.advanceRound();
        vi.advanceTimersByTime(4000);
      }
    }
    expect(used.size).toBe(5);
  });
});
