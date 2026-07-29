import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Socket } from "socket.io-client";
import {
  startTestServer,
  connectPair,
  emitR,
  waitFor,
  closeSockets,
  type TestServer,
} from "../helpers/socketHarness.js";

describe("integration: game flow", () => {
  let server: TestServer;
  let p1: Socket;
  let p2: Socket;
  let roomCode: string;

  beforeAll(async () => {
    server = await startTestServer();
  });

  afterAll(async () => {
    closeSockets(p1, p2);
    await server.close();
  });

  it("create + join room with 2 players", async () => {
    [p1, p2] = await connectPair(server.url);

    const created = await emitR(p1, "create_room", { nickname: "Alice" });
    roomCode = created.roomCode;
    expect(roomCode).toMatch(/^[A-Z2-9]{6}$/);

    const joinEvent = waitFor(p1, "room_joined");
    const joinRes = await emitR(p2, "join_room", { roomCode, nickname: "Bob" });
    const joined = await joinEvent;

    expect(joinRes.room.players).toHaveLength(2);
    expect(joined.room.players).toHaveLength(2);
  });

  it("both ready → game_starting + countdown + new_round", async () => {
    const startP = Promise.all([
      waitFor(p1, "game_starting"),
      waitFor(p2, "game_starting"),
    ]);

    p1.emit("player_ready", { roomCode });
    await waitFor(p1, "player_ready_update");
    p2.emit("player_ready", { roomCode });

    const [gs1, gs2] = await startP;
    expect(gs1.totalRounds).toBe(5);
    expect(gs2.totalRounds).toBe(5);

    const tick = await waitFor(p1, "countdown_tick");
    expect([3, 2, 1, 0]).toContain(tick.count);

    const [r1, r2] = await Promise.all([
      waitFor(p1, "new_round", 6000),
      waitFor(p2, "new_round", 6000),
    ]);

    expect(r1.roundNumber).toBe(1);
    const hummer = r1.yourRole === "hummer" ? r1 : r2;
    const guesser = r1.yourRole === "guesser" ? r1 : r2;

    expect(hummer.song).not.toBeNull();
    expect(hummer.options).toHaveLength(0);
    expect(hummer.timeLimit).toBe(20);

    expect(guesser.song).toBeNull();
    expect(guesser.options).toHaveLength(4);
    expect(guesser.timeLimit).toBe(15);
  });

  it("start_humming → humming_started + timer_sync", async () => {
    // Re-fetch roles from latest state by playing from stored handlers is hard;
    // listen for next cycle by issuing humming on both — only hummer's session matters.
    // We need current roles: emit start_humming from both; only session reacts once.
    const hummingP = Promise.race([
      waitFor(p1, "humming_started", 3000),
      waitFor(p2, "humming_started", 3000),
    ]);

    p1.emit("start_humming", { roomCode });
    p2.emit("start_humming", { roomCode });

    const humming = await hummingP;
    expect(humming.message.length).toBeGreaterThan(0);

    const sync = await Promise.race([
      waitFor(p1, "timer_sync", 3000),
      waitFor(p2, "timer_sync", 3000),
    ]);
    expect(typeof sync.secondsElapsed).toBe("number");
    expect(sync.timeLimit).toBe(15);
    expect(typeof sync.serverTimestamp).toBe("number");
    expect(Math.abs(Date.now() - sync.serverTimestamp)).toBeLessThan(1000);
  });

  it("submit_guess → round_result", async () => {
    // Wait if still in first round; get options from a fresh approach:
    // store last new_round via one-shot if still active, else the guess already may have fired.
    // Simpler path: attach listeners and guess first option from whoever is guesser.
    const resultP = Promise.race([
      waitFor(p1, "round_result", 5000),
      waitFor(p2, "round_result", 5000),
    ]);

    // Both try first option ids from a synthetic guess — session only accepts guesser.
    // We need the real option list. Capture via requesting nothing — use song bank first song
    // as wrong/right doesn't matter for presence of event.
    p1.emit("submit_guess", { roomCode, songId: "s01" });
    p2.emit("submit_guess", { roomCode, songId: "s01" });

    const result = await resultP;
    expect("correct" in result).toBe(true);
    expect(typeof result.score).toBe("number");
    expect(result.scores).toHaveLength(2);
  });

  it("completes remaining rounds → game_over with 5 rounds", async () => {
    const autoPlay = (socket: Socket) => {
      socket.on("new_round", (d: any) => {
        if (d.yourRole === "hummer") {
          setTimeout(() => socket.emit("start_humming", { roomCode }), 50);
        }
        if (d.yourRole === "guesser" && d.options?.length) {
          setTimeout(
            () => socket.emit("submit_guess", { roomCode, songId: d.options[0].id }),
            150,
          );
        }
      });
    };
    autoPlay(p1);
    autoPlay(p2);

    // If still mid-match after round 1 result, advance happens server-side after 3s
    const [go1, go2] = await Promise.all([
      waitFor(p1, "game_over", 120_000),
      waitFor(p2, "game_over", 120_000),
    ]);

    expect(go1.rounds).toHaveLength(5);
    expect(go2.rounds).toHaveLength(5);
    expect(go1.scores).toHaveLength(2);
    expect("winner" in go1).toBe(true);
  }, 130_000);

  it("rematch both players → rematch_accepted + game_starting", async () => {
    p1.removeAllListeners("new_round");
    p2.removeAllListeners("new_round");

    const rematchP = Promise.all([
      waitFor(p1, "rematch_accepted", 5000),
      waitFor(p2, "rematch_accepted", 5000),
    ]);

    p1.emit("request_rematch", { roomCode });
    p2.emit("request_rematch", { roomCode });
    await rematchP;

    const newStart = await waitFor(p1, "game_starting", 3000);
    expect(newStart.round).toBe(1);
  });
});
