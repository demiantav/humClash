import { io, Socket } from "socket.io-client";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3001";

export const socket: Socket = io(SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ["websocket"],
});

export function connectSocket(): void {
  if (!socket.connected) {
    socket.connect();
    console.log("[socket] Connecting to", SERVER_URL);
  }
}

socket.on("connect", () => {
  console.log("[socket] Connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("[socket] Disconnected:", reason);
});

socket.on("connect_error", (err) => {
  console.log("[socket] Connection error:", err.message);
});
