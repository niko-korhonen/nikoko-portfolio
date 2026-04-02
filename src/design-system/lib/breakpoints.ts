/** Breakpoint ranges (px) — document on /s/primitive/breakpoints */
export const breakpoints = {
  s: { min: 0, max: 599 },
  m: { min: 600, max: 1023 },
  l: { min: 1024, max: 1439 },
  xl: { min: 1440, max: Number.POSITIVE_INFINITY },
} as const;

export type BreakpointName = keyof typeof breakpoints;
