import { describe, it, expect, beforeEach } from "vitest";
import {
  storeClip,
  getClip,
  deleteClip,
  deleteClipsForRoom,
  purgeExpiredClips,
  clipCount,
} from "./clipStore.js";

describe("clipStore", () => {
  beforeEach(() => {
    deleteClipsForRoom("R1");
    deleteClipsForRoom("R2");
  });

  it("stores and retrieves a clip", () => {
    const clip = storeClip("R1", Buffer.from("abc"), "audio/m4a");
    expect(clip.id).toBeTruthy();
    const got = getClip(clip.id);
    expect(got?.buffer.toString()).toBe("abc");
    expect(got?.mimeType).toBe("audio/m4a");
  });

  it("deletes by id and by room", () => {
    const a = storeClip("R1", Buffer.from("a"), "audio/m4a");
    storeClip("R1", Buffer.from("b"), "audio/m4a");
    storeClip("R2", Buffer.from("c"), "audio/m4a");
    deleteClip(a.id);
    expect(getClip(a.id)).toBeUndefined();
    deleteClipsForRoom("R1");
    expect(clipCount()).toBeGreaterThanOrEqual(1);
    deleteClipsForRoom("R2");
  });

  it("purges expired clips", () => {
    const clip = storeClip("R1", Buffer.from("x"), "audio/m4a", 1);
    expect(purgeExpiredClips(Date.now() + 10)).toBeGreaterThanOrEqual(1);
    expect(getClip(clip.id)).toBeUndefined();
  });
});
