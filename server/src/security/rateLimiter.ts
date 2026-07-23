const limits = new Map<string, { timestamps: number[]; blockedUntil: number }>();

const RATE_LIMITS = {
  create_room: { max: 3, windowMs: 60_000 },
  join_room: { max: 10, windowMs: 60_000 },
  report_player: { max: 5, windowMs: 60_000 },
  submit_guess: { max: 30, windowMs: 60_000 },
};

export function rateLimiter(socket: any, next: (err?: Error) => void) {
  const ip = socket.handshake.address || "unknown";
  socket.ip = ip;

  const originalOn = socket.onevent;
  socket.onevent = (packet: any) => {
    const eventName = packet.data?.[0];
    const limit = RATE_LIMITS[eventName as keyof typeof RATE_LIMITS];
    if (!limit) return originalOn.call(socket, packet);

    const now = Date.now();
    let entry = limits.get(ip);

    if (!entry) {
      entry = { timestamps: [], blockedUntil: 0 };
      limits.set(ip, entry);
    }

    if (entry.blockedUntil > now) {
      const remaining = Math.ceil((entry.blockedUntil - now) / 1000);
      if (typeof packet.data?.[packet.data.length - 1] === "function") {
        const cb = packet.data[packet.data.length - 1];
        cb({ success: false, error: `Demasiados intentos. Esperá ${remaining}s.` });
      }
      return;
    }

    entry.timestamps = entry.timestamps.filter((t) => now - t < limit.windowMs);

    if (entry.timestamps.length >= limit.max) {
      entry.blockedUntil = now + 30_000;
      if (typeof packet.data?.[packet.data.length - 1] === "function") {
        const cb = packet.data[packet.data.length - 1];
        cb({ success: false, error: "Demasiados intentos. Esperá 30s." });
      }
      return;
    }

    entry.timestamps.push(now);
    originalOn.call(socket, packet);
  };

  next();
}
