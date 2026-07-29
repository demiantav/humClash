import { checkRateLimit } from "./rateLimitCore.js";

export { clearRateLimitState, RATE_LIMITS, checkRateLimit } from "./rateLimitCore.js";

export function rateLimiter(socket: any, next: (err?: Error) => void) {
  const ip = socket.handshake.address || "unknown";
  socket.ip = ip;

  const originalOn = socket.onevent;
  socket.onevent = (packet: any) => {
    const eventName = packet.data?.[0];
    const result = checkRateLimit(ip, eventName);

    if (!result.allowed) {
      // packet.data still has no ack fn here — socket.io injects it inside onevent.
      // Reply via ack id when the client requested a callback.
      if (packet.id != null && typeof socket.ack === "function") {
        socket.ack(packet.id)({ success: false, error: result.error });
      }
      return;
    }

    originalOn.call(socket, packet);
  };

  next();
}
