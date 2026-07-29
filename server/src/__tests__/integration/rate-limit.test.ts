import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Socket } from "socket.io-client";
import {
  startTestServer,
  createClient,
  waitForConnect,
  closeSockets,
  type TestServer,
} from "../helpers/socketHarness.js";

describe("integration: rate limit", () => {
  let server: TestServer;
  let socket: Socket;

  beforeAll(async () => {
    server = await startTestServer();
    socket = createClient(server.url);
    await waitForConnect(socket);
  });

  afterAll(async () => {
    closeSockets(socket);
    await server.close();
  });

  it("blocks 4th create_room within the window", async () => {
    const results: any[] = [];

    for (let i = 0; i < 4; i++) {
      const res = await new Promise<any>((resolve) => {
        socket.emit("create_room", { nickname: `User${i}` }, (r: any) => resolve(r));
      });
      results.push(res);
    }

    const ok = results.filter((r) => r?.roomCode);
    const blocked = results.filter((r) => r?.success === false || r?.error);

    expect(ok.length).toBe(3);
    expect(blocked.length).toBeGreaterThanOrEqual(1);
    expect(String(blocked[0].error)).toMatch(/intentos/i);
  });
});
