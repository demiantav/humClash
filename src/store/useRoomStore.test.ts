import { describe, it, expect, beforeEach } from "vitest";
import { useRoomStore } from "./useRoomStore";

describe("useRoomStore", () => {
  beforeEach(() => {
    useRoomStore.getState().reset();
  });

  it("starts empty", () => {
    const s = useRoomStore.getState();
    expect(s.roomCode).toBeNull();
    expect(s.nickname).toBeNull();
    expect(s.isReady).toBe(false);
    expect(s.players).toEqual([]);
  });

  it("setRoom / setNickname / setReady / setPlayers", () => {
    const s = useRoomStore.getState();
    s.setRoom("ABC123");
    s.setNickname("Alice");
    s.setReady(true);
    s.setPlayers([{ id: "1", nickname: "Alice", isReady: true }]);

    const next = useRoomStore.getState();
    expect(next.roomCode).toBe("ABC123");
    expect(next.nickname).toBe("Alice");
    expect(next.isReady).toBe(true);
    expect(next.players).toHaveLength(1);
  });

  it("reset clears all fields", () => {
    useRoomStore.getState().setRoom("ABC123");
    useRoomStore.getState().setNickname("Alice");
    useRoomStore.getState().reset();
    expect(useRoomStore.getState().roomCode).toBeNull();
    expect(useRoomStore.getState().nickname).toBeNull();
  });
});
