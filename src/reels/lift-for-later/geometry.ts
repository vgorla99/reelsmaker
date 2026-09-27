// Shared layout geometry. The protagonist dot (dot.ts) and the props it
// interacts with (scenes/*) both read these, so the dot lands exactly on the
// seesaw end, the chair seat, the capsule slot… by construction.

import { ease, prog, rot, springIn } from "../../kit/anim";
import { T } from "./timeline";

export const DOT_R = 46;

// 01 hook
export const FLOOR1 = 1500;

// 02 problem — decade shrink + staircase
export const PROBLEM_CENTER = { x: 540, y: 1100 };
export const DECADE_AT = [200, 222, 244, 266] as const; // frames of each "bite"
export const DECADE_R = [210, 186, 164, 146, 130] as const;
export const DECADE_LABELS = ["30", "40", "50", "60"] as const;
export const STAIRS = {
  floorY: 1400,
  tops: [1310, 1220, 1130] as const,
  centers: [460, 620, 780] as const,
  path: "M180 1400 H380 V1310 H540 V1220 H700 V1130 H880",
};
export const STAIR_DOT_R = 36;

// 03 seesaw
export const PIVOT = { x: 540, y: 1330 };
export const BEAM_LEN = 820;
export const BEAM_T = 6;
export const SMALL_R = 18;
export const SMALL_OFFSETS: readonly [number, number][] = [
  [230, -21],
  [268, -21],
  [306, -21],
  [344, -21],
  [249, -55],
  [287, -55],
  [325, -55],
];
export const smallLandAt = (k: number) => T.seesaw + 40 + k * 6;
export const DOT_DROP = { start: T.seesaw + 90, impact: T.seesaw + 102 };
export const DOT_BEAM_OFFSET: [number, number] = [-330, -(BEAM_T / 2 + DOT_R)];
export const DOT_HOVER = { x: 330, y: 760 };

export function beamAngle(f: number): number {
  let a = 0;
  SMALL_OFFSETS.forEach((_, k) => {
    a += 1.3 * springIn(f, smallLandAt(k));
  });
  a += -22.4 * springIn(f, DOT_DROP.impact, true);
  return a;
}

export function beamPoint(u: number, v: number, f: number): [number, number] {
  const [dx, dy] = rot(u, v, beamAngle(f));
  return [PIVOT.x + dx, PIVOT.y + dy];
}

// 04 chair + capsules
export const CHAIR = {
  seatY: 1250,
  path: "M250 1450 H830 M430 1450 V950 M430 1250 H650 V1450",
};
export const SEAT_DOT = { x: 540, y: CHAIR.seatY - DOT_R };
export const STAND_Y = 1000;
export const REP_START = T.chair + 52;
export const REP_LEN = 22;
export const REPS = 4;

export const PILL = { x0: 130, w: 820, h: 96, ys: [1090, 1270] as const };
export const PILL_DOT_R = 19;
export const slotX = (i: number) => PILL.x0 + 48 + i * 50;
export const PILL_COUNTS = [11, 15] as const;
export const pillDotAt = (row: number, i: number) => T.chair + 152 + row * 6 + i * 3;
export const PROTAGONIST_TO_SLOT = { start: T.chair + 196, end: T.chair + 208 };

// 05 stat
export const STAT_C = { x: 540, y: 1000 };
export const RING_R = 300;
export const RING_N = 24;
export const STAT_R = 130;
export const STAT_PCT = 17;

// Ring radius over the stat chapter — collapses into the center on exit.
export function ringRadius(f: number): number {
  return RING_R * (1 - prog(f, T.statExit, T.cta, ease.inCubic));
}

// 06 cta
export const CTA_PILL = { x: 540, y: 1290, w: 620, h: 112 };
export const SUN_R = 200;
