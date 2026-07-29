export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

export interface RateLimitEntry {
  timestamps: number[];
  blockedUntil: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
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

const BLOCK_MS = 30_000;

const ipLimits = new Map<string, Map<string, RateLimitEntry>>();

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; error: string };

export function checkRateLimit(
  ip: string,
  eventName: string,
  now: number = Date.now(),
): RateLimitResult {
  const limit = RATE_LIMITS[eventName];
  if (!limit) return { allowed: true };

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
    return {
      allowed: false,
      error: `Demasiados intentos. Esperá ${remaining}s.`,
    };
  }

  // Block just expired → fresh window so the client isn't re-blocked immediately
  if (entry.blockedUntil > 0 && entry.blockedUntil <= now) {
    entry.blockedUntil = 0;
    entry.timestamps = [];
  }

  entry.timestamps = entry.timestamps.filter((t) => now - t < limit.windowMs);

  if (entry.timestamps.length >= limit.max) {
    entry.blockedUntil = now + BLOCK_MS;
    return { allowed: false, error: "Demasiados intentos. Esperá 30s." };
  }

  entry.timestamps.push(now);
  return { allowed: true };
}

export function clearRateLimitState(): void {
  ipLimits.clear();
}
