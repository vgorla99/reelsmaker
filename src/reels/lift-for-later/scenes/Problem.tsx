// 02 PROBLEM — "After 30 you lose muscle every decade you don't train it —
// and that's what makes stairs, shopping bags and getting up off the floor
// feel harder."
// Primary stage. A big ink-colored dot gets bitten smaller at each decade (a chip
// flies off), then shrinks, and tries to climb a staircase: two hops land,
// the third bonks the riser and falls back.

import React from "react";
import { ease, prog } from "../../../kit/anim";
import { Ripple } from "../../../kit/svg";
import { Fade, MaskLine, Typewriter } from "../../../kit/text";
import { DECADE_AT, DECADE_LABELS, DECADE_R, PROBLEM_CENTER, STAIRS, STAIR_DOT_R } from "../geometry";
import { C, FONT, inkOn } from "../../../kit/theme";

// This chapter sits on the primary stage.
const INK = inkOn(C.primary);

const DECADE_X = [300, 440, 640, 780] as const;
const STAIRS_IN = 280;
const HOPS = [304, 316, 322] as const;
const STAIR_LABELS = ["STAIRS", "SHOPPING BAGS", "THE FLOOR ×"] as const;

// A chip of muscle breaking off the dot at each decade.
const Chip: React.FC<{ f: number; at: number; i: number }> = ({ f, at, i }) => {
  if (f < at || f > at + 18) return null;
  const p = prog(f, at, at + 18, ease.outCubic);
  const ang = ((-40 - i * 28) * Math.PI) / 180;
  const d = DECADE_R[i] + 30 + 230 * p;
  return (
    <circle
      cx={PROBLEM_CENTER.x + Math.cos(ang) * d}
      cy={PROBLEM_CENTER.y + Math.sin(ang) * d}
      r={16 * (1 - p * 0.6)}
      fill={INK}
      opacity={1 - p}
    />
  );
};

export const ProblemBack: React.FC<{ f: number }> = ({ f }) => {
  const draw = prog(f, STAIRS_IN, STAIRS_IN + 14, ease.outCubic);
  return (
    <g>
      {DECADE_AT.map((at, i) => (
        <Chip key={at} f={f} at={at} i={i} />
      ))}
      {f >= STAIRS_IN ? (
        <path
          d={STAIRS.path}
          fill="none"
          stroke={INK}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
      ) : null}
      <Ripple f={f} at={304} x={STAIRS.centers[0]} y={STAIRS.tops[0]} color={INK} size={90} />
      <Ripple f={f} at={316} x={STAIRS.centers[1]} y={STAIRS.tops[1]} color={INK} size={90} />
      <Ripple f={f} at={330} x={STAIRS.centers[1]} y={STAIRS.tops[1]} color={INK} size={70} />
    </g>
  );
};

export const ProblemFront: React.FC<{ f: number }> = ({ f }) => {
  let active = -1;
  DECADE_AT.forEach((at, i) => {
    if (f >= at) active = i;
  });
  return (
    <>
      <MaskLine f={f} inAt={160} outAt={272} top={300} size={76} color={INK}>
        After 30 you lose
      </MaskLine>
      <MaskLine f={f} inAt={168} outAt={275} top={392} size={76} color={INK}>
        muscle every decade
      </MaskLine>
      <MaskLine f={f} inAt={176} outAt={278} top={484} size={76} color={INK}>
        you don't train it.
      </MaskLine>

      <MaskLine f={f} inAt={286} top={300} size={76} color={INK}>
        That's what makes
      </MaskLine>
      <MaskLine f={f} inAt={294} top={392} size={76} color={INK}>
        everyday life
      </MaskLine>
      <MaskLine f={f} inAt={302} top={484} size={76} color={INK}>
        feel harder.
      </MaskLine>

      <Fade f={f} inAt={188} outAt={272}>
        {DECADE_LABELS.map((d, i) => (
          <div
            key={d}
            style={{
              position: "absolute",
              top: PROBLEM_CENTER.y + DECADE_R[0] + 60,
              left: DECADE_X[i] - 60,
              width: 120,
              textAlign: "center",
              fontFamily: FONT.mono,
              fontWeight: 700,
              fontSize: 34,
              color: INK,
              opacity: i === active ? 1 : 0.3,
            }}
          >
            {d}
          </div>
        ))}
        <Typewriter
          f={f}
          start={204}
          text="3–8% LESS MUSCLE / DECADE"
          top={PROBLEM_CENTER.y + DECADE_R[0] + 140}
          size={30}
          color={INK}
          weight={700}
          opacity={0.9}
        />
      </Fade>

      {STAIR_LABELS.map((label, i) => {
        if (f < HOPS[i]) return null;
        const o = prog(f, HOPS[i], HOPS[i] + 6);
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              top: STAIRS.tops[i] - 2 * STAIR_DOT_R - 56,
              left: STAIRS.centers[i] - 150,
              width: 300,
              textAlign: "center",
              fontFamily: FONT.mono,
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: "0.08em",
              color: INK,
              opacity: o * (i === 2 ? 0.55 : 1),
              transform: `translateY(${(1 - o) * 12}px)`,
            }}
          >
            {label}
          </div>
        );
      })}
    </>
  );
};
