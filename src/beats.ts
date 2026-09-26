// Beat timing + Instagram output spec. JSX-free so the CLI can import it.

// Instagram Reels / Stories spec — a hard requirement, not a default:
// 1080x1920 (9:16), 30fps, and every reel must stay at or under 60s.
export const REEL_WIDTH = 1080;
export const REEL_HEIGHT = 1920;
export const REEL_FPS = 30;
export const MAX_REEL_SECONDS = 60;

// Six beats, 40s @ 30fps = 1200 frames:
// HOOK -> PROBLEM -> POINT A -> POINT B -> STAT/PROOF -> CTA.
export const BEATS = {
  hook: { start: 0, end: 105 },
  problem: { start: 105, end: 270 },
  pointA: { start: 270, end: 480 },
  pointB: { start: 480, end: 690 },
  stat: { start: 690, end: 930 },
  cta: { start: 930, end: 1200 },
} as const;

export type BeatName = keyof typeof BEATS;

export const BEAT_ORDER: readonly BeatName[] = ["hook", "problem", "pointA", "pointB", "stat", "cta"];

export const REEL_DURATION = BEATS.cta.end; // 1200 frames / 40s

if (REEL_DURATION > MAX_REEL_SECONDS * REEL_FPS) {
  throw new Error(`BEATS total ${REEL_DURATION} frames exceeds the ${MAX_REEL_SECONDS}s Instagram ceiling`);
}

// Every beat boundary gets a WipeTransition; these are the frames where the
// wipe panel fully covers the screen.
export const BEAT_BOUNDARIES: readonly number[] = BEAT_ORDER.slice(1).map((b) => BEATS[b].start);

// Frames the ReelsMaker contact sheet samples: for each boundary, the wipe
// entering (-8), fully covering (0) and revealing (+8); plus each beat's
// midpoint. Sorted ascending.
export const WIPE_SAMPLE_OFFSET = 8;
export const CONTACT_SHEET_FRAMES: readonly number[] = [
  ...BEAT_BOUNDARIES.flatMap((b) => [b - WIPE_SAMPLE_OFFSET, b, b + WIPE_SAMPLE_OFFSET]),
  ...BEAT_ORDER.map((b) => Math.round((BEATS[b].start + BEATS[b].end) / 2)),
].sort((a, b) => a - b);
