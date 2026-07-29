import { createServer, type Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { io as Client, type Socket } from "socket.io-client";
import { RoomManager } from "../../rooms/RoomManager.js";
import {
  registerGameHandlers,
  handleGameDisconnect,
} from "../../game-logic/socket-handlers.js";
import { registerRoomHandlers } from "../../rooms/socket-handlers.js";
import { rateLimiter, clearRateLimitState } from "../../security/rateLimiter.js";
import { clearReports } from "../../moderation/ReportHandler.js";

export interface TestServer {
  io: Server;
  httpServer: HttpServer;
  port: number;
  roomManager: RoomManager;
  url: string;
  close: () => Promise<void>;
}

export async function startTestServer(): Promise<TestServer> {
  clearRateLimitState();
  clearReports();

  const httpServer = createServer((_req, res) => {
    res.writeHead(404);
    res.end();
  });
  const io = new Server(httpServer, { cors: { origin: "*" } });
  const roomManager = new RoomManager();

  io.use(rateLimiter);
  io.on("connection", (s) => {
    registerRoomHandlers(io, s, roomManager);
    registerGameHandlers(io, s, roomManager);
    s.on("disconnect", () => {
      handleGameDisconnect(io, s.id, roomManager);
      roomManager.handleDisconnect(s.id);
    });
  });

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const addr = httpServer.address();
  if (!addr || typeof addr === "string") {
    throw new Error("Failed to bind test server");
  }
  const port = addr.port;

  return {
    io,
    httpServer,
    port,
    roomManager,
    url: `http://localhost:${port}`,
    close: async () => {
      io.close();
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}

export function createClient(url: string): Socket {
  return Client(url, { transports: ["websocket"], forceNew: true });
}

export function waitForConnect(socket: Socket): Promise<void> {
  if (socket.connected) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("connect timeout")), 5000);
    socket.once("connect", () => {
      clearTimeout(t);
      resolve();
    });
    socket.once("connect_error", (err) => {
      clearTimeout(t);
      reject(err);
    });
  });
}

export function waitFor(socket: Socket, event: string, ms = 5000): Promise<any> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout waiting for: ${event}`)), ms);
    socket.once(event, (d: any) => {
      clearTimeout(t);
      resolve(d);
    });
  });
}

export function emitR(socket: Socket, event: string, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Emit timeout: ${event}`)), 3000);
    socket.emit(event, data, (r: any) => {
      clearTimeout(t);
      if (r?.error || r?.success === false) {
        reject(new Error(r.error || "request failed"));
      } else {
        resolve(r);
      }
    });
  });
}

export async function connectPair(url: string): Promise<[Socket, Socket]> {
  const p1 = createClient(url);
  const p2 = createClient(url);
  await Promise.all([waitForConnect(p1), waitForConnect(p2)]);
  return [p1, p2];
}

export function closeSockets(...sockets: Socket[]): void {
  for (const s of sockets) {
    s.removeAllListeners();
    s.close();
  }
}
