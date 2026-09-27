// The protagonist contract. Every reel has ONE shape that carries the story
// and morphs into every graphic. A reel describes it as a pure function
// `(frame) => DotState`; <Protagonist> renders it (with velocity
// squash-and-stretch and glow). Circle, pill, coin, button — all are the
// same rounded rect with different w / h / rx.

export interface DotState {
  x: number; // center
  y: number;
  w: number;
  h: number;
  rx: number;
  fill: string;
  glow: number; // 0 = none, 1 = normal, >1 = hot
  sx: number; // extra horizontal scale (e.g. coin flip)
  visible: boolean;
  stretch: boolean; // allow velocity squash-and-stretch
}

export type DotFn = (frame: number) => DotState;

export const HIDDEN: DotState = { x: 0, y: 0, w: 0, h: 0, rx: 0, fill: "#000000", glow: 0, sx: 1, visible: false, stretch: false };

// A circle of radius r centered at (x, y). `sq` < 1 squashes it vertically
// while keeping its bottom edge planted (impacts).
export function circle(x: number, y: number, r: number, fill: string, glow: number, sq = 1, stretch = true): DotState {
  const w = (2 * r) / sq;
  const h = 2 * r * sq;
  return { x, y: y + (2 * r - h) / 2, w, h, rx: Math.min(w, h) / 2, fill, glow, sx: 1, visible: r > 0.5, stretch };
}

// A pill / rounded rect (buttons, capsules, bars).
export function pill(x: number, y: number, w: number, h: number, fill: string, glow = 0): DotState {
  return { x, y, w, h, rx: h / 2, fill, glow, sx: 1, visible: w > 0.5 && h > 0.5, stretch: false };
}
