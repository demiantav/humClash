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

describe("integration: disconnect", () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it("notifies rival on disconnect during round_active", async () => {
    const [p3, p4] = await connectPair(server.url);
    const { roomCode } = await emitR(p3, "create_room", { nickname: "Charlie" });
    const joined = waitFor(p3, "room_joined");
    await emitR(p4, "join_room", { roomCode, nickname: "Diana" });
    await joined;

    p3.emit("player_ready", { roomCode });
    p4.emit("player_ready", { roomCode });

    await waitFor(p3, "new_round", 10_000);

    const dcP = waitFor(p4, "player_disconnected", 5000);
    p3.close();

    const dc = await dcP;
    expect(dc.disconnectedPlayer.nickname).toBe("Charlie");

    closeSockets(p4);
  });

  it.todo("notifies rival on disconnect during countdown (Fase 7 edge case)");
});
