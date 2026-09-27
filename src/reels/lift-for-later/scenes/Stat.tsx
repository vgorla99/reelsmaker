// 05 THE RESULT — "17% lower risk of early death with 30–60 min a week of
// strength training." (Momma et al., Br J Sports Med 2022)
// The dot reappears as a glowing core; a ring of 24 dots orbits it; a primary
// arc sweeps 17% of the ring, lighting those dots; a flower of rings blooms.
// On exit everything collapses into the core, which becomes the sun (06).

import React from "react";
import { ease, prog, springIn } from "../../../kit/anim";
import { MaskLine, Typewriter } from "../../../kit/text";
import { RING_N, STAT_C, STAT_PCT, STAT_R, ringRadius } from "../geometry";
import { C, FONT, inkOn } from "../../../kit/theme";
import { T } from "../timeline";

const S = T.stat;
const SWEEP = { start: S + 32, end: S + 74 };
const BLOOM = S + 80;

function arcPath(r: number, a0: number, a1: number): string {
  const p = (a: number) => {
    const rad = (a * Math.PI) / 180;
    return `${STAT_C.x + r * Math.cos(rad)} ${STAT_C.y + r * Math.sin(rad)}`;
  };
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${p(a0)} A${r} ${r} 0 ${large} 1 ${p(a1)}`;
}

export const StatBack: React.FC<{ f: number }> = ({ f }) => {
  const spin = 0.35 * (f - S);
  const R = ringRadius(f);
  const sweep = ((360 * STAT_PCT) / 100) * prog(f, SWEEP.start, SWEEP.end, ease.outCubic);
  const exit = prog(f, T.statExit, T.cta, ease.inCubic);
  const a0 = -90 + spin;
  return (
    <g>
      {Array.from({ length: 8 }).map((_, j) => {
        const s = springIn(f, BLOOM + j * 2) * (1 - exit);
        if (s <= 0.001) return null;
        const a = ((j * 45 + spin * 0.6) * Math.PI) / 180;
        const d = 150 * s;
        return (
          <circle
            key={j}
            cx={STAT_C.x + Math.cos(a) * d}
            cy={STAT_C.y + Math.sin(a) * d}
            r={150 * s}
            fill="none"
            stroke={C.light}
            strokeWidth={2}
            opacity={0.32}
          />
        );
      })}
      {sweep > 0.5 && R > 4 ? (
        <path d={arcPath(R, a0, a0 + sweep)} fill="none" stroke={C.primary} strokeWidth={6} strokeLinecap="round" opacity={0.95 * (1 - exit)} />
      ) : null}
      {Array.from({ length: RING_N }).map((_, i) => {
        const pop = springIn(f, S + 12 + i * 1.2, true);
        if (pop <= 0.001) return null;
        const rel = (i * 360) / RING_N;
        const lit = sweep > 0.5 && rel <= sweep + 0.01;
        const a = ((a0 + rel) * Math.PI) / 180;
        return (
          <circle
            key={i}
            cx={STAT_C.x + Math.cos(a) * R}
            cy={STAT_C.y + Math.sin(a) * R}
            r={(lit ? 15 : 9) * pop}
            fill={lit || exit > 0.3 ? C.primary : C.light}
            opacity={lit ? 1 : 0.55 + 0.45 * exit}
          />
        );
      })}
    </g>
  );
};

export const StatFront: React.FC<{ f: number }> = ({ f }) => {
  const value = Math.round(STAT_PCT * prog(f, SWEEP.start, SWEEP.end, ease.outCubic));
  const numO = prog(f, S + 18, S + 26) * (1 - prog(f, T.statExit, T.statExit + 12));
  const textOut = T.statExit;
  const captionO = 1 - prog(f, textOut, textOut + 10);
  const sourceO = prog(f, S + 90, S + 100) * captionO;
  return (
    <>
      <MaskLine f={f} inAt={S + 10} outAt={textOut} top={300} size={100} color={C.primary}>
        LOWER RISK
      </MaskLine>
      <MaskLine f={f} inAt={S + 18} outAt={textOut + 3} top={404} size={100} color={C.light}>
        OF EARLY DEATH.
      </MaskLine>
      <div
        style={{
          position: "absolute",
          left: STAT_C.x - STAT_R,
          top: STAT_C.y - 62,
          width: STAT_R * 2,
          textAlign: "center",
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: 104,
          lineHeight: 1.15,
          letterSpacing: "-0.05em",
          color: inkOn(C.primary),
          opacity: numO,
        }}
      >
        {value}%
      </div>
      {captionO > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: captionO }}>
          <Typewriter f={f} start={S + 44} text="with 30–60 min a week" top={1420} size={32} color={C.light} cps={1.8} />
          <Typewriter f={f} start={S + 58} text="of strength training." top={1466} size={32} color={C.light} cps={1.8} />
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          top: 1560,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT.mono,
          fontWeight: 500,
          fontSize: 20,
          letterSpacing: "0.06em",
          color: C.light,
          opacity: 0.45 * sourceO,
        }}
      >
        MOMMA ET AL. · BR J SPORTS MED · 2022
      </div>
    </>
  );
};
