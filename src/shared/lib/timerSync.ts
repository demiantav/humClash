export function estimateElapsed(
  secondsElapsed: number,
  serverTimestamp: number,
): number {
  const now = Date.now();
  const networkDelta = (now - serverTimestamp) / 1000;
  return Math.max(0, secondsElapsed + networkDelta);
}

export function calculateTimeRatio(
  secondsElapsed: number,
  serverTimestamp: number,
  timeLimit: number,
): number {
  const elapsed = estimateElapsed(secondsElapsed, serverTimestamp);
  return Math.min(1, Math.max(0, elapsed / timeLimit));
}
