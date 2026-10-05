// The brand wordmark (BRAND.mark): prefix bold, suffix light.
// Slides up out of a mask at `inAt`.

import React from "react";
import { BRAND } from "../brand";
import { ease, prog } from "../kit/anim";
import { FONT } from "../kit/theme";

export const Wordmark: React.FC<{ f: number; inAt: number; top: number; size: number; color: string; sub?: string; subColor?: string }> = ({
  f,
  inAt,
  top,
  size,
  color,
  sub,
  subColor = color,
}) => {
  if (f < inAt) return null;
  const y = (1 - prog(f, inAt, inAt + 18, ease.outExpo)) * 110;
  const subIn = prog(f, inAt + 10, inAt + 24, ease.outCubic);
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center" }}>
      <div style={{ height: size * 1.15, overflow: "hidden" }}>
        <div style={{ transform: `translateY(${y}%)`, fontFamily: FONT.display, fontSize: size, lineHeight: 1.1, color, letterSpacing: "-0.01em" }}>
          <span style={{ fontWeight: 700 }}>{BRAND.mark.prefix}</span>
          <span style={{ fontWeight: 300 }}>{BRAND.mark.suffix}</span>
        </div>
      </div>
      {sub ? (
        <div
          style={{
            marginTop: size * 0.12,
            fontFamily: FONT.display,
            fontWeight: 500,
            fontSize: size * 0.26,
            letterSpacing: "0.22em",
            color: subColor,
            opacity: subIn,
            transform: `translateY(${(1 - subIn) * 20}px)`,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};
