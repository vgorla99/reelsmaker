// 03 STRENGTH BEATS STEPS — "Walking keeps your heart healthy. Only lifting
// tells your body to keep its muscle."
// A crowd of small "steps" dots piles onto the right of a seesaw and tips it;
// the glowing protagonist drops onto the left and slams it the other way.

import React from "react";
import { ease, prog, tween } from "../../../kit/anim";
import { Ripple } from "../../../kit/svg";
import { MaskLine, Typewriter } from "../../../kit/text";
import { BEAM_LEN, BEAM_T, DOT_BEAM_OFFSET, DOT_DROP, PIVOT, SMALL_OFFSETS, SMALL_R, beamAngle, beamPoint, smallLandAt } from "../geometry";
import { C, FONT } from "../../../kit/theme";
import { T } from "../timeline";

const S = T.seesaw;

export const SeesawBack: React.FC<{ f: number }> = ({ f }) => {
  const draw = prog(f, S + 8, S + 28, ease.outExpo);
  const half = (BEAM_LEN / 2) * draw;
  const [ax, ay] = beamPoint(-half, 0, f);
  const [bx, by] = beamPoint(half, 0, f);
  const tri = prog(f, S + 14, S + 26);
  const [ix, iy] = beamPoint(DOT_BEAM_OFFSET[0], 0, f);
  return (
    <g>
      <polygon
        points={`${PIVOT.x},${PIVOT.y + BEAM_T / 2} ${PIVOT.x - 56},${PIVOT.y + 86} ${PIVOT.x + 56},${PIVOT.y + 86}`}
        fill="none"
        stroke={C.light}
        strokeWidth={3}
        strokeLinejoin="round"
        opacity={tri}
      />
      <line x1={ax} y1={ay} x2={bx} y2={by} stroke={C.light} strokeWidth={BEAM_T} strokeLinecap="round" />
      {SMALL_OFFSETS.map(([u, v], k) => {
        const land = smallLandAt(k);
        if (f < land - 10) return null;
        // jiggle when the protagonist slams the other end
        const since = f - DOT_DROP.impact - k;
        const jig = since >= 0 && since < 12 ? -28 * Math.sin((Math.PI * since) / 12) : 0;
        const [rx, ry] = beamPoint(u, v + jig, f);
        const y = f < land ? tween(f, land - 10, land, ry - 720, ry, ease.inQuad) : ry;
        return <circle key={k} cx={rx} cy={y} r={SMALL_R} fill={C.light} opacity={0.92} />;
      })}
      <Ripple f={f} at={DOT_DROP.impact} x={ix} y={iy} color={C.primary} size={160} />
    </g>
  );
};

const BeamLabel: React.FC<{ f: number; u: number; text: string; color: string; inAt: number }> = ({ f, u, text, color, inAt }) => {
  if (f < inAt) return null;
  const [x, y] = beamPoint(u, 46, f);
  return (
    <div
      style={{
        position: "absolute",
        left: x - 200,
        top: y - 14,
        width: 400,
        textAlign: "center",
        transform: `rotate(${beamAngle(f)}deg)`,
        fontFamily: FONT.mono,
        fontWeight: 700,
        fontSize: 24,
        letterSpacing: "0.12em",
        color,
        opacity: prog(f, inAt, inAt + 8),
      }}
    >
      {text}
    </div>
  );
};

export const SeesawFront: React.FC<{ f: number }> = ({ f }) => (
  <>
    <MaskLine f={f} inAt={S + 6} top={300} size={112} color={C.secondary}>
      STRENGTH
    </MaskLine>
    <MaskLine f={f} inAt={S + 14} top={426} size={112} color={C.light}>
      BEATS STEPS.
    </MaskLine>
    <BeamLabel f={f} u={290} text="EXTRA STEPS" color={C.light} inAt={smallLandAt(2)} />
    <BeamLabel f={f} u={DOT_BEAM_OFFSET[0]} text="LIFTING" color={C.primary} inAt={DOT_DROP.impact} />
    {f < DOT_DROP.impact + 6 ? (
      <Typewriter f={f} start={S + 44} text="Walking keeps your heart healthy." top={1600} size={32} color={C.light} cps={1.5} />
    ) : (
      <Typewriter f={f} start={DOT_DROP.impact + 6} text="Only lifting tells your body to keep its muscle." top={1600} size={32} color={C.light} cps={1.6} />
    )}
  </>
);
