// SVG building blocks: the protagonist renderer, impact ripples, and the two
// transition types (circle flood from the dot, rectangular frame-border wipe).

import React from "react";
import { ease, prog, tween } from "./anim";
import type { DotFn } from "./protagonist";
import { H, W } from "./theme";

// Renders a reel's protagonist `dot(f)`. Circles get velocity-based
// squash-and-stretch along their direction of travel — that's what makes
// the dot feel liquid.
export const Protagonist: React.FC<{ f: number; dot: DotFn }> = ({ f, dot }) => {
  const s = dot(f);
  if (!s.visible) return null;
  const p = dot(f - 1);
  let transform = `translate(${s.x} ${s.y})`;
  if (s.stretch && p.visible) {
    const dx = s.x - p.x;
    const dy = s.y - p.y;
    const v = Math.hypot(dx, dy);
    if (v > 2) {
      const k = 1 + Math.min(v / 110, 0.32);
      const a = (Math.atan2(dy, dx) * 180) / Math.PI;
      transform += ` rotate(${a}) scale(${k} ${1 / k}) rotate(${-a})`;
    }
  }
  transform += ` scale(${s.sx} 1)`;
  // Halo padded by the SHORT side, so a wide pill gets a tight glow instead
  // of a screen-wide haze; for a circle this equals a 1.8x halo.
  const minSide = Math.min(s.w, s.h);
  const pad = minSide * 0.4;
  return (
    <g transform={transform}>
      {s.glow > 0 ? (
        <rect
          x={-s.w / 2 - pad}
          y={-s.h / 2 - pad}
          width={s.w + 2 * pad}
          height={s.h + 2 * pad}
          rx={s.rx + pad}
          fill={s.fill}
          opacity={0.45 * Math.min(s.glow, 1.5)}
          style={{ filter: `blur(${Math.max(14, minSide * 0.28)}px)` }}
        />
      ) : null}
      <rect x={-s.w / 2} y={-s.h / 2} width={s.w} height={s.h} rx={s.rx} fill={s.fill} />
    </g>
  );
};

// Flat elliptical shock ring where something lands.
export const Ripple: React.FC<{ f: number; at: number; x: number; y: number; color: string; size?: number }> = ({ f, at, x, y, color, size = 150 }) => {
  if (f < at || f > at + 22) return null;
  const p = prog(f, at, at + 22, ease.outCubic);
  const rx = 20 + size * p;
  return <ellipse cx={x} cy={y} rx={rx} ry={rx * 0.16} fill="none" stroke={color} strokeWidth={3} opacity={(1 - p) * 0.7} />;
};

// The dot swells into the whole screen (circle reveal).
export const CircleFlood: React.FC<{ f: number; start: number; cover: number; x: number; y: number; r0: number; color: string }> = ({
  f,
  start,
  cover,
  x,
  y,
  r0,
  color,
}) => {
  if (f < start || f >= cover) return null;
  const r = tween(f, start, cover, r0, 2300, ease.inOutCubic);
  return <circle cx={x} cy={y} r={r} fill={color} />;
};

// A frame border thickens inward until it covers the screen, then its hole
// reopens from the center on the next scene (ref: pink frame wipe).
export const BorderWipe: React.FC<{ f: number; start: number; cover: number; end: number; color: string }> = ({ f, start, cover, end, color }) => {
  if (f < start || f >= end) return null;
  const full = W / 2 + 2;
  const t = f < cover ? tween(f, start, cover, 0, full, ease.inOutCubic) : tween(f, cover, end, full, 0, ease.inOutCubic);
  const ix = t;
  const iy = t * (H / W);
  const d = `M0 0H${W}V${H}H0Z M${ix} ${iy}V${H - iy}H${W - ix}V${iy}Z`;
  return <path d={d} fill={color} fillRule="evenodd" />;
};

// Animated film grain — deterministic (seed from frame), subtle.
export const Grain: React.FC<{ f: number }> = ({ f }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "overlay", opacity: 0.09 }}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 12} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width={W} height={H} filter="url(#grain)" />
  </svg>
);
