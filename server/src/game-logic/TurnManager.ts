export class TurnManager {
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private startTimes: Map<string, number> = new Map();

  startTimer(
    roomCode: string,
    onTick: (elapsed: number) => void,
    onEnd: () => void,
    timeLimit: number,
  ): void {
    this.startTimes.set(roomCode, Date.now());

    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed++;
      onTick(elapsed);

      if (elapsed >= timeLimit) {
        this.clearTimer(roomCode);
        onEnd();
      }
    }, 1000);

    this.timers.set(roomCode, timer);
  }

  clearTimer(roomCode: string): void {
    const timer = this.timers.get(roomCode);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(roomCode);
    }
    this.startTimes.delete(roomCode);
  }

  getElapsed(roomCode: string): number {
    const startTime = this.startTimes.get(roomCode);
    if (!startTime) return 0;
    return Math.round((Date.now() - startTime) / 1000);
  }

  hasTimer(roomCode: string): boolean {
    return this.timers.has(roomCode);
  }
}
