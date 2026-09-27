// 06 CTA — "Lift for later." / "Strength coaching for 35+. In person & online."
// The ring has collapsed into the core; it swells into a radiant sun (rays
// flick out), then squashes into the "Follow" button while the headline
// slides in above it.

import React from "react";
import { ease, prog } from "../../../kit/anim";
import { MaskLine, Typewriter } from "../../../kit/text";
import { CTA_PILL, STAT_C, SUN_R } from "../geometry";
import { BRAND, C, FONT, inkOn } from "../../../kit/theme";
import { T } from "../timeline";

const S = T.cta;
const RAYS = 14;

const PULSE = { start: S + 90, every: 36, len: 34 };

// "Tap me" rings breathing out of the button once it has formed.
const PillPulses: React.FC<{ f: number }> = ({ f }) => {
  if (f < PULSE.start) return null;
  const since = (f - PULSE.start) % PULSE.every;
  if (since > PULSE.len) return null;
  const p = prog(since, 0, PULSE.len, ease.outCubic);
  const grow = 40 * p;
  const w = CTA_PILL.w + 2 * grow;
  const h = CTA_PILL.h + 2 * grow;
  return (
    <rect
      x={CTA_PILL.x - w / 2}
      y={CTA_PILL.y - h / 2}
      width={w}
      height={h}
      rx={h / 2}
      fill="none"
      stroke={C.primary}
      strokeWidth={3}
      opacity={0.6 * (1 - p)}
    />
  );
};

export const CtaBack: React.FC<{ f: number }> = ({ f }) => {
  const out = prog(f, S + 12, S + 26, ease.outCubic);
  const back = prog(f, S + 32, S + 42, ease.inCubic);
  const len = 44 * out * (1 - back);
  const r0 = SUN_R + 40 + 20 * out;
  return (
    <g>
      <PillPulses f={f} />
      {len > 0.5 &&
        Array.from({ length: RAYS }).map((_, i) => {
        const a = ((i * 360) / RAYS + (f - S) * 0.8) * (Math.PI / 180);
        return (
          <line
            key={i}
            x1={STAT_C.x + Math.cos(a) * r0}
            y1={STAT_C.y + Math.sin(a) * r0}
            x2={STAT_C.x + Math.cos(a) * (r0 + len)}
            y2={STAT_C.y + Math.sin(a) * (r0 + len)}
            stroke={C.primary}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.9}
          />
        );
      })}
    </g>
  );
};

export const CtaFront: React.FC<{ f: number }> = ({ f }) => {
  const labelO = prog(f, S + 66, S + 78, ease.outCubic);
  return (
    <>
      <MaskLine f={f} inAt={S + 60} top={440} size={60} color={C.light}>
        {BRAND.mark.prefix}
        <span style={{ color: C.primary }}>{BRAND.mark.suffix}</span>
      </MaskLine>
      <MaskLine f={f} inAt={S + 66} top={540} size={184} color={C.light}>
        LIFT FOR
      </MaskLine>
      <MaskLine f={f} inAt={S + 74} top={740} size={184} color={C.primary}>
        LATER.
      </MaskLine>
      <div
        style={{
          position: "absolute",
          left: CTA_PILL.x - CTA_PILL.w / 2,
          top: CTA_PILL.y - CTA_PILL.h / 2,
          width: CTA_PILL.w,
          height: CTA_PILL.h,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: 38,
          letterSpacing: "0.04em",
          color: inkOn(C.primary),
          opacity: labelO,
          transform: `scale(${0.9 + 0.1 * labelO})`,
        }}
      >
        FOLLOW {BRAND.handle.toUpperCase()}
      </div>
      <Typewriter f={f} start={S + 84} text="Strength coaching for 35+." top={1420} size={32} color={C.light} cps={1.8} />
      <Typewriter f={f} start={S + 100} text="In person & online." top={1466} size={32} color={C.light} cps={1.8} />
    </>
  );
};
