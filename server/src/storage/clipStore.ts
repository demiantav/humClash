import { randomUUID } from "node:crypto";

export interface StoredClip {
  id: string;
  roomCode: string;
  buffer: Buffer;
  mimeType: string;
  createdAt: number;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000; // 2h
const clips = new Map<string, StoredClip>();

export function storeClip(
  roomCode: string,
  buffer: Buffer,
  mimeType: string,
  ttlMs = DEFAULT_TTL_MS,
): StoredClip {
  const id = randomUUID();
  const now = Date.now();
  const clip: StoredClip = {
    id,
    roomCode,
    buffer,
    mimeType: mimeType || "audio/m4a",
    createdAt: now,
    expiresAt: now + ttlMs,
  };
  clips.set(id, clip);
  return clip;
}

export function getClip(id: string): StoredClip | undefined {
  const clip = clips.get(id);
  if (!clip) return undefined;
  if (Date.now() > clip.expiresAt) {
    clips.delete(id);
    return undefined;
  }
  return clip;
}

export function deleteClip(id: string): void {
  clips.delete(id);
}

export function deleteClipsForRoom(roomCode: string): void {
  for (const [id, clip] of clips) {
    if (clip.roomCode === roomCode) clips.delete(id);
  }
}

export function purgeExpiredClips(now = Date.now()): number {
  let n = 0;
  for (const [id, clip] of clips) {
    if (now > clip.expiresAt) {
      clips.delete(id);
      n++;
    }
  }
  return n;
}

export function clipCount(): number {
  return clips.size;
}
