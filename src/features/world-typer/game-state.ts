export type GamePhase = 'preStart' | 'playing' | 'paused' | 'ended' | 'review';

const GAME_MS = 15 * 60 * 1000;

export class GameTimer {
  private deadlineMs = 0;
  private tickCb: ((remainingMs: number) => void) | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  /** Remaining time when pause was requested (only meaningful while paused). */
  private pausedRemainingMs = GAME_MS;

  start(onTick: (remainingMs: number) => void): void {
    this.tickCb = onTick;
    this.pausedRemainingMs = GAME_MS;
    this.deadlineMs = Date.now() + GAME_MS;
    this.clearInterval();
    this.intervalId = setInterval(() => this.emitTick(), 250);
    this.emitTick();
  }

  resume(onTick: (remainingMs: number) => void): void {
    this.tickCb = onTick;
    this.deadlineMs = Date.now() + this.pausedRemainingMs;
    this.clearInterval();
    this.intervalId = setInterval(() => this.emitTick(), 250);
    this.emitTick();
  }

  pause(): void {
    this.pausedRemainingMs = Math.max(0, this.deadlineMs - Date.now());
    this.clearInterval();
  }

  private emitTick(): void {
    const remaining = Math.max(0, this.deadlineMs - Date.now());
    this.tickCb?.(remaining);
    if (remaining <= 0) {
      this.clearInterval();
    }
  }

  private clearInterval(): void {
    if (this.intervalId != null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  dispose(): void {
    this.clearInterval();
    this.tickCb = null;
  }
}

export function formatTimer(remainingMs: number): string {
  const totalSec = Math.ceil(remainingMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
