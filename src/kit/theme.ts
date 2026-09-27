// ReelsMaker motion system — shared by every reel. The palette comes from
// src/brand.ts (five roles), and is contrast-checked here at load time.

import { BRAND } from "../brand";

export { BRAND };

export const W = 1080;
export const H = 1920;
export const FPS = 30;
export const MAX_FRAMES = 60 * FPS; // Instagram Reels ceiling

export const C = BRAND.colors;

// WCAG relative luminance / contrast ratio.
function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Ink for text/shapes sitting on `stage`: whichever of dark/light reads better.
export const inkOn = (stage: string) => (contrast(stage, C.dark) >= contrast(stage, C.light) ? C.dark : C.light);
export const isLight = (stage: string) => inkOn(stage) === C.dark;

// An accent that stays visible on `stage` (for small marks and highlights).
export function accentOn(stage: string): string {
  return [C.secondary, C.primary].find((c) => c !== stage && contrast(c, stage) >= 3) ?? inkOn(stage);
}

// Fail fast on an illegible brand — every pair below is used somewhere.
const HEX = /^#[0-9a-fA-F]{6}$/;
const CHECKS: readonly [keyof typeof C, keyof typeof C, number, string][] = [
  ["light", "dark", 7, "body text on dark / light stages"],
  ["primary", "dark", 4.5, "the protagonist + highlights on dark"],
  ["light", "tertiary", 4.5, "text on the tertiary stage"],
  ["primary", "tertiary", 3, "highlights + CTA on the tertiary stage"],
  ["secondary", "dark", 3, "secondary accents on dark"],
  ["secondary", "light", 3, "secondary accents on light"],
];
for (const [k, v] of Object.entries(C)) {
  if (!HEX.test(v)) throw new Error(`src/brand.ts: colors.${k} must be a #rrggbb hex color, got "${v}"`);
}
for (const [a, b, min, use] of CHECKS) {
  const r = contrast(C[a], C[b]);
  if (r < min) {
    throw new Error(`src/brand.ts: colors.${a} vs colors.${b} contrast is ${r.toFixed(2)}:1, needs ≥ ${min}:1 (${use}).`);
  }
}

export const FONT = {
  display: "'Space Grotesk'", // 500 / 700 — headlines, numbers
  mono: "'JetBrains Mono'", // 500 / 700 — captions, labels (the "annotation" voice)
} as const;

export const MARGIN = 90;
