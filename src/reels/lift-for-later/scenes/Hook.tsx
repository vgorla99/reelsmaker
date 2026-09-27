// 01 HOOK — "After 40, muscle is your pension."
// The dot drops onto a floor line and bounces; the headline builds line by
// line; on "pension" the dot is tossed like a coin, then swells into the
// primary-colored world of chapter 02.

import React from "react";
import { ease, prog } from "../../../kit/anim";
import { Ripple } from "../../../kit/svg";
import { MaskLine, Typewriter } from "../../../kit/text";
import { DOT_R, FLOOR1 } from "../geometry";
import { C, FONT } from "../../../kit/theme";
import { T } from "../timeline";

export const HookBack: React.FC<{ f: number }> = ({ f }) => {
  const w = 640 * prog(f, 2, 24, ease.outExpo);
  return (
    <g>
      <line x1={540 - w / 2} x2={540 + w / 2} y1={FLOOR1} y2={FLOOR1} stroke={C.light} strokeOpacity={0.35} strokeWidth={2} />
      <Ripple f={f} at={18} x={540} y={FLOOR1} color={C.primary} size={170} />
      <Ripple f={f} at={45} x={540} y={FLOOR1} color={C.primary} size={110} />
      <Ripple f={f} at={T.land} x={540} y={FLOOR1} color={C.primary} size={200} />
    </g>
  );
};

export const HookFront: React.FC<{ f: number }> = ({ f }) => {
  const noteOpacity = prog(f, T.toss + 6, T.toss + 14) * (1 - prog(f, T.land - 4, T.land + 4));
  return (
    <>
      <MaskLine f={f} inAt={48} top={430} size={150} color={C.light}>
        AFTER 40,
      </MaskLine>
      <MaskLine f={f} inAt={58} top={592} size={150} color={C.primary}>
        MUSCLE
      </MaskLine>
      <MaskLine f={f} inAt={68} top={754} size={150} color={C.light}>
        IS YOUR
      </MaskLine>
      <MaskLine f={f} inAt={78} top={916} size={150} color={C.light}>
        PENSION.
      </MaskLine>
      <Typewriter f={f} start={8} text="HEALTH 101" top={FLOOR1 + 70} size={28} color={C.light} weight={700} tracking="0.3em" cps={1.2} />
      <div
        style={{
          position: "absolute",
          left: 540 + DOT_R + 40,
          top: 1150,
          fontFamily: FONT.mono,
          fontWeight: 500,
          fontSize: 26,
          color: C.primary,
          opacity: noteOpacity,
        }}
      >
        {"<- it compounds."}
      </div>
    </>
  );
};
