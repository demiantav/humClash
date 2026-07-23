interface EventEntry {
  timestamps: number[];
  blockedUntil: number;
}

const ipLimits = new Map<string, Map<string, EventEntry>>();

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  create_room: { max: 3, windowMs: 60_000 },
  join_room: { max: 10, windowMs: 60_000 },
  report_player: { max: 5, windowMs: 60_000 },
  submit_guess: { max: 30, windowMs: 60_000 },
  start_humming: { max: 30, windowMs: 60_000 },
  request_rehum: { max: 5, windowMs: 60_000 },
  request_rematch: { max: 10, windowMs: 60_000 },
  start_game: { max: 10, windowMs: 60_000 },
  accept_rematch: { max: 10, windowMs: 60_000 },
  player_ready: { max: 10, windowMs: 60_000 },
  leave_room: { max: 10, windowMs: 60_000 },
};

export function rateLimiter(socket: any, next: (err?: Error) => void) {
  const ip = socket.handshake.address || "unknown";
  socket.ip = ip;

  const originalOn = socket.onevent;
  socket.onevent = (packet: any) => {
    const eventName = packet.data?.[0];
    const limit = RATE_LIMITS[eventName];
    if (!limit) return originalOn.call(socket, packet);

    const now = Date.now();

    if (!ipLimits.has(ip)) {
      ipLimits.set(ip, new Map());
    }
    const eventMap = ipLimits.get(ip)!;

    if (!eventMap.has(eventName)) {
      eventMap.set(eventName, { timestamps: [], blockedUntil: 0 });
    }
    const entry = eventMap.get(eventName)!;

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
