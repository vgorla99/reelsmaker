// Frame-pure animation helpers. Everything is a function of the frame
// number — no randomness, no timers — so renders are deterministic.

import { interpolateColors, spring } from "remotion";
import { FPS } from "./theme";

export type Ease = (t: number) => number;

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export const ease = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inExpo: (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  outBack: (t: number) => {
    const c1 = 1.9;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
} satisfies Record<string, Ease>;

// Eased 0..1 progress of `f` through [f0, f1].
export function prog(f: number, f0: number, f1: number, e: Ease = ease.inOutCubic): number {
  return e(clamp01((f - f0) / (f1 - f0)));
}

// Eased value from a to b over [f0, f1].
export function tween(f: number, f0: number, f1: number, a: number, b: number, e: Ease = ease.inOutCubic): number {
  return a + (b - a) * prog(f, f0, f1, e);
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function mix(a: string, b: string, t: number): string {
  return interpolateColors(clamp01(t), [0, 1], [a, b]);
}

// Spring 0 -> 1 starting at `start` (0 before it). `bouncy` overshoots.
export function springIn(f: number, start: number, bouncy = false): number {
  if (f < start) return 0;
  return spring({
    frame: f - start,
    fps: FPS,
    config: bouncy ? { damping: 9, stiffness: 160, mass: 0.9 } : { damping: 16, stiffness: 170 },
  });
}

// Parabolic hop: position from p0 to p1 with apex `height` px above the chord.
export function hop(t: number, x0: number, y0: number, x1: number, y1: number, height: number): [number, number] {
  return [lerp(x0, x1, t), lerp(y0, y1, t) - height * 4 * t * (1 - t)];
}

// Impact squash: 1 at rest, dips to (1 - depth) right after `at`, recovers
// with a small rebound over `len` frames.
export function squash(f: number, at: number, depth = 0.3, len = 10): number {
  if (f < at || f > at + len) return 1;
  const t = (f - at) / len;
  return 1 - depth * Math.sin(Math.PI * t) * (1 - t * 0.6);
}

// Rotate (x, y) around origin by deg.
export function rot(x: number, y: number, deg: number): [number, number] {
  const r = (deg * Math.PI) / 180;
  return [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
}

// Typewriter: the visible prefix of `text`.
export function typed(f: number, start: number, text: string, cps = 1.4): string {
  return text.slice(0, Math.max(0, Math.floor((f - start) * cps)));
}
