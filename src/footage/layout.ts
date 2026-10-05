// Fixed layout of the footage template (1080x1920). Text sits in the top
// third and the TikTok-safe caption band; the dot works the middle.

import { MARGIN, W } from "../kit/theme";

export const R = 26; // dot radius
export const IRIS_LEN = 20; // frames for a clip to open out of the dot
export const IRIS_MAX = 2300;

export const SAFE_CAPTION_Y = 1440; // lowest text line — below this TikTok's UI covers the frame
export const CAPTION_Y = 1440; // spoken captions take the safe band (a beat's note is dropped then)
export const CAPTION_W = 860; // keeps clear of TikTok's right-hand button rail
export const PAGE_LEN = 22; // frames for a stage -> stage page slide
export const HOOK_TOP = 360; // hook headline, line 1
export const TITLE_TOP = 250; // beat headline, line 1
export const TITLE_MAX = 124; // headline size when the line is short enough
export const TITLE_BIG = 150; // a centred title on an empty stage
export const CENTER_TOP = 720;

export const HOOK = { x: 540, y: 1180 };
export const SPOTS = [
  { x: 860, y: 1180 },
  { x: 220, y: 1180 },
  { x: 540, y: 1240 },
] as const; // where the dot rests in beats without rows, in turn
export const CTA_SPOT = { x: 540, y: 1180 };
export const BUTTON = { x: 540, y: 1180, w: 780, h: 140 };

// Blocks live in the middle band; in a block beat the dot rests just above it.
export const BLOCK_SPOT = { x: 540, y: 960 };
export const BLOCK_TOP = 1010;
export const JAR_BIG = { x: 540, top: 1010, w: 380, h: 420 };
export const JAR_SMALL = { x: 540, top: 620, w: 200, h: 240 }; // above a rows panel

export const PANEL = { top: 1030, h: 370, x: 70 };
export const BULLET_X = 150;
export const ROW_Y = [1100, 1210, 1320] as const;
export const ROW_H = 110;

// Outfit Bold advance widths in em, by character class (uppercase headlines).
// Estimated, then rounded up; review sheets are the final check.
const NARROW = new Set("IJ1.,:;!'|");
const WIDE = new Set("MWÄÖÜ");
function emWidth(text: string): number {
  let w = 0;
  for (const ch of text) {
    if (ch === " ") w += 0.26;
    else if (NARROW.has(ch)) w += 0.3;
    else if (WIDE.has(ch)) w += ch === "M" || ch === "W" ? 0.86 : 0.7;
    else w += 0.64;
  }
  return w * 0.98; // letter-spacing -0.02em
}

// Largest headline size (<= max) at which `text` fits between the margins.
export function fitSize(text: string, max = TITLE_MAX): number {
  const avail = W - 2 * MARGIN;
  return Math.min(max, Math.floor(avail / Math.max(emWidth(text), 1)));
}

// One size for both lines of a title, so they read as a pair.
export function titleSize(lines: readonly [string, string], max = TITLE_MAX): number {
  return Math.min(fitSize(lines[0], max), fitSize(lines[1], max));
}
