// The protagonist. One dot carries the whole reel: it drops, gets tossed like
// a coin, floods the screen, shrinks with age, fails a staircase, outweighs a
// crowd on a seesaw, does chair-stands, becomes the 15th rep, glows as the
// stat, becomes the sun, and finally morphs into the CTA button.
//
// dotState(f) is a pure function of the frame. Each chapter hands off to the
// next at a flood/wipe that starts from the dot's exact position.

import { ease, hop, lerp, mix, prog, springIn, squash, tween } from "../../kit/anim";
import {
  CTA_PILL,
  DECADE_AT,
  DECADE_R,
  DOT_BEAM_OFFSET,
  DOT_DROP,
  DOT_HOVER,
  DOT_R,
  FLOOR1,
  PILL,
  PILL_DOT_R,
  PROBLEM_CENTER,
  PROTAGONIST_TO_SLOT,
  REPS,
  REP_LEN,
  REP_START,
  SEAT_DOT,
  STAIRS,
  STAIR_DOT_R,
  STAND_Y,
  STAT_C,
  STAT_R,
  SUN_R,
  beamPoint,
  slotX,
} from "./geometry";
import { type DotState, HIDDEN, circle } from "../../kit/protagonist";
import { C, inkOn } from "../../kit/theme";
import { T } from "./timeline";

// 01 — drop, bounce, rest, coin toss
function hookDot(f: number): DotState {
  const rest = FLOOR1 - DOT_R;
  let y = rest;
  if (f < 18) y = tween(f, 0, 18, -120, rest, ease.inQuad);
  else if (f >= 22 && f < 34) y = tween(f, 22, 34, rest, rest - 190, ease.outQuad);
  else if (f >= 34 && f < 45) y = tween(f, 34, 45, rest - 190, rest, ease.inQuad);

  if (f >= T.toss) {
    const t = prog(f, T.toss, T.land, ease.linear);
    const r = lerp(DOT_R, 60, t);
    const [x, ty] = hop(t, 540, rest, 540, FLOOR1 - r, 330);
    const s = circle(x, ty, r, C.primary, 1, squash(f, T.land, 0.25), false);
    // three half-turns: the coin shows its edge mid-air
    return { ...s, sx: f < T.land ? Math.max(0.08, Math.abs(Math.cos(Math.PI * t * 3))) : 1 };
  }
  return circle(540, y, DOT_R, C.primary, 1, squash(f, 18, 0.32) * squash(f, 45, 0.2));
}

// 02 — born from the primary flood, bitten per decade, then the stairs
function problemDot(f: number): DotState {
  if (f < T.problem + 4) return HIDDEN;
  const ink = inkOn(C.primary); // on the primary stage
  if (f < 282) {
    let r = DECADE_R[0] * springIn(f, T.problem + 4, true);
    let sq = 1;
    DECADE_AT.forEach((at, i) => {
      if (f >= at) r = tween(f, at, at + 10, DECADE_R[i], DECADE_R[i + 1], ease.outBack);
      sq *= squash(f, at, 0.1, 12);
    });
    return circle(PROBLEM_CENTER.x, PROBLEM_CENTER.y, r, ink, 0, sq, false);
  }
  const floorRest = STAIRS.floorY - STAIR_DOT_R;
  const s1 = STAIRS.tops[0] - STAIR_DOT_R;
  const s2 = STAIRS.tops[1] - STAIR_DOT_R;
  if (f < 292) {
    const t = prog(f, 282, 292);
    return circle(lerp(540, 290, t), lerp(PROBLEM_CENTER.y, floorRest, t), lerp(DECADE_R[4], STAIR_DOT_R, t), ink, 0);
  }
  const sq = squash(f, 304, 0.3) * squash(f, 316, 0.3) * squash(f, 330, 0.35);
  if (f < 304) {
    const [x, y] = hop(prog(f, 292, 304, ease.linear), 290, floorRest, STAIRS.centers[0], s1, 130);
    return circle(x, y, STAIR_DOT_R, ink, 0);
  }
  if (f < 316) {
    const [x, y] = hop(prog(f, 304, 316, ease.linear), STAIRS.centers[0], s1, STAIRS.centers[1], s2, 100);
    return circle(x, y, STAIR_DOT_R, ink, 0, sq);
  }
  if (f < 330) {
    // third hop fails: bonks the riser and drops back
    const t = prog(f, 316, 330, ease.linear);
    const x = STAIRS.centers[1] + 62 * Math.sin(Math.PI * t);
    const y = s2 - 60 * Math.sin(Math.PI * t);
    return circle(x, y, STAIR_DOT_R, ink, 0, sq);
  }
  return circle(STAIRS.centers[1], s2, STAIR_DOT_R, ink, 0, sq);
}

// 03 — hovers above the seesaw, drops, outweighs the crowd
function seesawDot(f: number): DotState {
  const r = DOT_R * springIn(f, T.seesaw + 4, true);
  const bob = (fr: number) => DOT_HOVER.y + 14 * Math.sin((fr - T.seesaw) / 8);
  if (f < DOT_DROP.start) return circle(DOT_HOVER.x, bob(f), r, C.primary, 1);
  const [tx, ty] = beamPoint(DOT_BEAM_OFFSET[0], DOT_BEAM_OFFSET[1], f);
  if (f < DOT_DROP.impact) {
    const t = prog(f, DOT_DROP.start, DOT_DROP.impact, ease.linear);
    return circle(lerp(DOT_HOVER.x, tx, ease.outQuad(t)), lerp(bob(DOT_DROP.start), ty, ease.inQuad(t)), DOT_R, C.primary, 1);
  }
  return circle(tx, ty, DOT_R, C.primary, 1, squash(f, DOT_DROP.impact, 0.34, 12));
}

const HOVER_Y = 860;
const HOVER_AT = T.chair + 156;

// 04 — drops onto the chair, does 4 reps, hovers while the chair becomes two
// capsules, then flies into the 15th capsule slot
function chairDot(f: number): DotState {
  const drop = T.chair + 18;
  if (f < drop) return HIDDEN;
  const ink = C.dark;
  if (f < drop + 18) return circle(SEAT_DOT.x, tween(f, drop, drop + 18, -100, SEAT_DOT.y, ease.inQuad), DOT_R, ink, 0);

  const repsEnd = REP_START + REPS * REP_LEN;
  if (f >= REP_START && f < repsEnd) {
    const k = Math.floor((f - REP_START) / REP_LEN);
    const s = REP_START + k * REP_LEN;
    const half = REP_LEN / 2;
    const y =
      f < s + half
        ? tween(f, s, s + half, SEAT_DOT.y, STAND_Y, ease.outCubic)
        : tween(f, s + half, s + REP_LEN, STAND_Y, SEAT_DOT.y, ease.inCubic);
    return circle(SEAT_DOT.x, y, DOT_R, ink, 0, k > 0 ? squash(f, s, 0.22, 8) : 1);
  }

  const tx = slotX(14);
  const ty = PILL.ys[1];
  if (f < repsEnd) {
    return circle(SEAT_DOT.x, SEAT_DOT.y, DOT_R, ink, 0, squash(f, drop + 18, 0.3));
  }
  // chair retracts under it: the dot lifts off and hovers above the capsules
  const hoverY = (fr: number) => HOVER_Y + 10 * Math.sin((fr - HOVER_AT) / 7);
  if (f < HOVER_AT) {
    return circle(SEAT_DOT.x, tween(f, repsEnd, HOVER_AT, SEAT_DOT.y, hoverY(HOVER_AT), ease.outCubic), DOT_R, ink, 0);
  }
  if (f < PROTAGONIST_TO_SLOT.start) return circle(SEAT_DOT.x, hoverY(f), DOT_R, ink, 0);
  if (f < PROTAGONIST_TO_SLOT.end) {
    const t = prog(f, PROTAGONIST_TO_SLOT.start, PROTAGONIST_TO_SLOT.end, ease.inOutQuad);
    const [x, y] = hop(t, SEAT_DOT.x, hoverY(PROTAGONIST_TO_SLOT.start), tx, ty, 120);
    // turns secondary-colored in flight — it becomes one of the WEEK 12 reps
    return circle(x, y, lerp(DOT_R, PILL_DOT_R, t), mix(ink, C.secondary, t), 0);
  }
  return circle(tx, ty, PILL_DOT_R, C.secondary, 0, squash(f, PROTAGONIST_TO_SLOT.end, 0.3, 8));
}

// 05 — the glowing stat core
function statDot(f: number): DotState {
  return circle(STAT_C.x, STAT_C.y, STAT_R * springIn(f, T.stat + 2, true), C.primary, 1, 1, false);
}

// 06 — swells into the sun, then morphs into the CTA button
function ctaDot(f: number): DotState {
  const r = lerp(STAT_R, SUN_R, prog(f, T.cta, T.cta + 28, ease.outCubic));
  const m = prog(f, T.cta + 40, T.cta + 70, ease.inOutCubic);
  const pulse = f > T.cta + 110 ? 1 + 0.025 * Math.sin((f - T.cta - 110) / 7) : 1;
  const w = lerp(2 * r, CTA_PILL.w, m) * pulse;
  const h = lerp(2 * r, CTA_PILL.h, m) * pulse;
  return { x: STAT_C.x, y: lerp(STAT_C.y, CTA_PILL.y, m), w, h, rx: h / 2, fill: C.primary, glow: lerp(1.3, 0.7, m), sx: 1, visible: true, stretch: false };
}

export function dotState(f: number): DotState {
  if (f < T.flood1.start) return hookDot(f);
  if (f < T.problem) return HIDDEN; // the primary flood IS the dot here
  if (f < T.flood2.start) return problemDot(f);
  if (f < T.seesaw) return HIDDEN;
  if (f < T.wipe3.cover) return seesawDot(f);
  if (f < T.flood4.start) return chairDot(f);
  if (f < T.stat) return HIDDEN;
  if (f < T.cta) return statDot(f);
  return ctaDot(f);
}

// Where each flood starts: the dot's position on the frame the flood begins.
export const FLOOD_ORIGIN = {
  flood1: { x: 540, y: FLOOR1 - 60, r: 60 },
  flood2: { x: STAIRS.centers[1], y: STAIRS.tops[1] - STAIR_DOT_R, r: STAIR_DOT_R },
  flood4: { x: slotX(14), y: PILL.ys[1], r: PILL_DOT_R },
} as const;
