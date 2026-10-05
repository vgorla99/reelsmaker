// The protagonist of every footage reel: a gold dot that drops in on the
// hook, hops to a resting spot in each beat (or marks each panel row), opens
// every next clip out of itself, and finally becomes the CTA button.

import { ease, hop, lerp, prog, squash, tween } from "../kit/anim";
import { type DotFn, circle } from "../kit/protagonist";
import { C } from "../kit/theme";
import { BLOCK_SPOT, BULLET_X, BUTTON, CTA_SPOT, HOOK, R, ROW_Y, SPOTS } from "./layout";
import type { FootageSpec, Timing } from "./spec";

type Pt = { readonly x: number; readonly y: number };
interface Leg {
  a: Pt;
  b: Pt;
  start: number;
  land: number;
  height: number;
}

// The hook's drop + three shrinking hops (frames from 0).
const DROP_LAND = 16;
const HOPS = [
  { start: 26, end: 44, height: 160 },
  { start: 46, end: 68, height: 90 },
  { start: 70, end: 94, height: 34 },
] as const;

// Row k's hop inside a rows beat, relative to the beat start.
export const rowHop = (k: number) => ({ start: 18 + 28 * k, land: 36 + 28 * k });
// The CTA: hop to the button spot, then grow into the button.
export const CTA_HOP = { start: 8, land: 30 } as const;
export const CTA_MORPH = { start: 40, end: 62 } as const;

const same = (a: Pt, b: Pt) => a.x === b.x && a.y === b.y;

function legs(spec: FootageSpec, tm: Timing): Leg[] {
  const out: Leg[] = [];
  let at: Pt = HOOK;
  let spot = 0;
  spec.beats.forEach((beat, i) => {
    if (i === 0) return;
    const s = tm.starts[i];
    if (beat.rows) {
      beat.rows.forEach((_, k) => {
        const b = { x: BULLET_X, y: ROW_Y[k] };
        const h = rowHop(k);
        out.push({ a: at, b, start: s + h.start, land: s + h.land, height: k === 0 ? 200 : 60 });
        at = b;
      });
      return;
    }
    let b: Pt = SPOTS[spot % SPOTS.length];
    if (beat.block && beat.block.type !== "none") b = BLOCK_SPOT;
    else {
      if (same(b, at)) b = SPOTS[++spot % SPOTS.length];
      spot++;
    }
    if (same(b, at)) return; // already there (two block beats in a row)
    out.push({ a: at, b, start: s + 26, land: s + 50, height: 160 });
    at = b;
  });
  const s = tm.starts[spec.beats.length];
  if (!same(at, CTA_SPOT)) out.push({ a: at, b: CTA_SPOT, start: s + CTA_HOP.start, land: s + CTA_HOP.land, height: 120 });
  return out;
}

export function makeDot(spec: FootageSpec, tm: Timing): DotFn {
  const route = legs(spec, tm);
  const lands = route.map((l) => l.land);
  const hookEnd = tm.starts[1];
  const ctaStart = tm.starts[spec.beats.length];
  const morph = { start: ctaStart + CTA_MORPH.start, end: ctaStart + CTA_MORPH.end };

  const travel = (f: number): Pt => {
    let p: Pt = HOOK;
    for (const l of route) {
      if (f < l.start) break;
      const [x, y] = hop(prog(f, l.start, l.land, ease.linear), l.a.x, l.a.y, l.b.x, l.b.y, l.height);
      p = { x, y };
    }
    return p;
  };

  const hookY = (f: number): number => {
    if (f < DROP_LAND) return tween(f, 0, DROP_LAND, -120, HOOK.y, ease.inQuad);
    for (const h of HOPS) {
      if (f >= h.start && f < h.end) return hop(prog(f, h.start, h.end, ease.linear), 0, HOOK.y, 0, HOOK.y, h.height)[1];
    }
    return HOOK.y;
  };

  return (f: number) => {
    if (f < hookEnd) {
      const sq = HOPS.reduce((s, h) => s * squash(f, h.end, 0.22), squash(f, DROP_LAND, 0.32));
      return circle(HOOK.x, hookY(f), R, C.primary, 1, sq);
    }
    if (f < morph.start) {
      const p = travel(f);
      const sq = lands.reduce((s, at) => s * squash(f, at, 0.28), 1);
      return circle(p.x, p.y, R, C.primary, 1, sq);
    }
    const b = prog(f, morph.start, morph.end, ease.inOutCubic);
    return {
      x: BUTTON.x,
      y: BUTTON.y,
      w: lerp(2 * R, BUTTON.w, b),
      h: lerp(2 * R, BUTTON.h, b),
      rx: lerp(R, BUTTON.h / 2, b),
      fill: C.primary,
      glow: 1,
      sx: 1,
      visible: true,
      stretch: false,
    };
  };
}
