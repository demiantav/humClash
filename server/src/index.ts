import { createServer } from "node:http";
import { Server } from "socket.io";
import { RoomManager } from "./rooms/RoomManager.js";
import { registerGameHandlers } from "./game-logic/socket-handlers.js";
import { registerRoomHandlers } from "./rooms/socket-handlers.js";
import { rateLimiter } from "./security/rateLimiter.js";

const PORT = Number(process.env.PORT) || 3001;

const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

const roomManager = new RoomManager();

io.use(rateLimiter);

io.on("connection", (socket) => {
  console.log(`[connection] ${socket.id}`);

  registerRoomHandlers(io, socket, roomManager);
  registerGameHandlers(io, socket, roomManager);

  socket.on("disconnect", (reason) => {
    console.log(`[disconnect] ${socket.id} — ${reason}`);
    roomManager.handleDisconnect(socket.id);
  });

  socket.on("disconnecting", () => {
    for (const roomCode of socket.rooms) {
      if (roomCode !== socket.id) {
        roomManager.handleDisconnect(socket.id);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[server] HumClash server running on port ${PORT}`);
});
