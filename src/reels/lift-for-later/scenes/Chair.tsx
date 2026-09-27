// 04 THE CHAIR-STAND TEST — "Stand up from a chair as many times as you can
// in 30 seconds. Re-test every 12 weeks." (WEEK 0: 11 reps -> WEEK 12: 15)
// Light stage. A chair draws itself, the dot does 4 quick reps with a rep
// counter, then the chair retracts into two capsules that fill with dots —
// and the protagonist itself flies in as the 15th rep.

import React from "react";
import { ease, prog, springIn } from "../../../kit/anim";
import { MaskLine, Typewriter } from "../../../kit/text";
import { CHAIR, PILL, PILL_COUNTS, PILL_DOT_R, PROTAGONIST_TO_SLOT, REPS, REP_LEN, REP_START, pillDotAt, slotX } from "../geometry";
import { C, FONT } from "../../../kit/theme";
import { T } from "../timeline";

const S = T.chair;
const CAPSULES_IN = S + 150; // after the chair has fully retracted (S + 148)
const LABELS = ["WEEK 0", "WEEK 12"] as const;

export const ChairBack: React.FC<{ f: number }> = ({ f }) => {
  const draw = prog(f, S + 14, S + 50, ease.outCubic) - prog(f, S + 138, S + 148, ease.inCubic);
  const pillDraw = prog(f, CAPSULES_IN, CAPSULES_IN + 20, ease.outCubic);
  return (
    <g>
      {draw > 0 ? (
        <path
          d={CHAIR.path}
          fill="none"
          stroke={C.dark}
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />
      ) : null}
      {f >= CAPSULES_IN
        ? PILL.ys.map((cy, row) => (
            <g key={row}>
              <rect
                x={PILL.x0}
                y={cy - PILL.h / 2}
                width={PILL.w}
                height={PILL.h}
                rx={PILL.h / 2}
                fill="none"
                stroke={C.dark}
                strokeWidth={3}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - pillDraw}
              />
              {Array.from({ length: row === 0 ? PILL_COUNTS[0] : PILL_COUNTS[1] - 1 }).map((_, i) => {
                const at = pillDotAt(row, i);
                if (f < at) return null;
                const p = prog(f, at, at + 9, ease.outCubic);
                const x = PILL.x0 + 24 + (slotX(i) - PILL.x0 - 24) * p;
                const r = PILL_DOT_R * Math.min(springIn(f, at, true), 1.15);
                return row === 0 ? (
                  <circle key={i} cx={x} cy={cy} r={r} fill="none" stroke={C.dark} strokeWidth={3} />
                ) : (
                  <circle key={i} cx={x} cy={cy} r={r} fill={C.secondary} />
                );
              })}
            </g>
          ))
        : null}
    </g>
  );
};

function repCount(f: number): number {
  return Math.max(0, Math.min(REPS, Math.floor((f - REP_START + REP_LEN / 2) / REP_LEN)));
}

function pillCount(f: number, row: number): number {
  const total = row === 0 ? PILL_COUNTS[0] : PILL_COUNTS[1] - 1;
  let n = 0;
  for (let i = 0; i < total; i++) if (f >= pillDotAt(row, i) + 6) n++;
  if (row === 1 && f >= PROTAGONIST_TO_SLOT.end) n++;
  return n;
}

export const ChairFront: React.FC<{ f: number }> = ({ f }) => {
  const reps = repCount(f);
  const lastRepAt = REP_START + (reps - 1) * REP_LEN + REP_LEN / 2;
  const pop = reps > 0 ? 1 + 0.12 * (1 - prog(f, lastRepAt, lastRepAt + 8, ease.outCubic)) : 1;
  const counterO = prog(f, REP_START - 6, REP_START) * (1 - prog(f, S + 140, S + 150));
  return (
    <>
      <MaskLine f={f} inAt={S + 4} top={300} size={96} color={C.dark}>
        THE CHAIR-STAND
      </MaskLine>
      <MaskLine f={f} inAt={S + 12} top={404} size={96} color={C.dark}>
        TEST.
      </MaskLine>
      {f < CAPSULES_IN ? (
        <Typewriter
          f={f}
          start={S + 20}
          text="Stand up from a chair as many times as you can in 30 seconds."
          top={540}
          size={30}
          color={C.dark}
          align="left"
          cps={2}
        />
      ) : (
        <Typewriter f={f} start={CAPSULES_IN + 4} text="Re-test every 12 weeks." top={540} size={30} color={C.dark} align="left" cps={1.6} />
      )}

      {counterO > 0 ? (
        <div style={{ position: "absolute", right: 90, top: 930, textAlign: "right", opacity: counterO }}>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 700,
              fontSize: 210,
              lineHeight: 1,
              letterSpacing: "-0.05em",
              color: C.dark,
              transform: `scale(${pop})`,
              transformOrigin: "right bottom",
            }}
          >
            {String(reps).padStart(2, "0")}
          </div>
          <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: 22, letterSpacing: "0.14em", color: C.dark, opacity: 0.6, marginTop: 8 }}>
            REPS · 30 SEC
          </div>
        </div>
      ) : null}

      {f >= CAPSULES_IN
        ? PILL.ys.map((cy, row) => (
            <div
              key={row}
              style={{
                position: "absolute",
                left: PILL.x0 + 8,
                width: PILL.w - 16,
                top: cy - PILL.h / 2 - 44,
                display: "flex",
                justifyContent: "space-between",
                fontFamily: FONT.mono,
                fontWeight: 700,
                fontSize: 24,
                letterSpacing: "0.1em",
                color: C.dark,
                opacity: prog(f, CAPSULES_IN + 6, CAPSULES_IN + 14),
              }}
            >
              <span>{LABELS[row]}</span>
              <span style={{ color: row === 1 ? C.secondary : C.dark }}>{pillCount(f, row)} REPS</span>
            </div>
          ))
        : null}
    </>
  );
};
