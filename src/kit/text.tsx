// Text layer: masked slide-up headlines (display face), typewriter captions
// (mono "annotation" voice), and the persistent corner chrome.

import React from "react";
import { ease, prog, typed } from "./anim";
import { BRAND, FONT, MARGIN, accentOn, inkOn } from "./theme";

// A single headline line that slides up out of a mask on `inAt` and exits
// upward on `outAt`.
export const MaskLine: React.FC<{
  f: number;
  inAt: number;
  outAt?: number;
  top: number;
  size: number;
  color: string;
  left?: number;
  align?: "left" | "center";
  weight?: number;
  children: React.ReactNode;
}> = ({ f, inAt, outAt, top, size, color, left = MARGIN, align = "left", weight = 700, children }) => {
  if (f < inAt) return null;
  const pin = prog(f, inAt, inAt + 16, ease.outExpo);
  const pout = outAt !== undefined ? prog(f, outAt, outAt + 10, ease.inCubic) : 0;
  const y = (1 - pin) * 110 - pout * 110;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: align === "center" ? 0 : left,
        right: align === "center" ? 0 : undefined,
        height: size * 1.12,
        overflow: "hidden",
        textAlign: align,
      }}
    >
      <div
        style={{
          transform: `translateY(${y}%)`,
          fontFamily: FONT.display,
          fontWeight: weight,
          fontSize: size,
          lineHeight: 1.08,
          letterSpacing: "-0.035em",
          color,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Mono caption that types itself out with a block cursor.
export const Typewriter: React.FC<{
  f: number;
  start: number;
  text: string;
  top: number;
  size?: number;
  color: string;
  align?: "left" | "center";
  opacity?: number;
  cps?: number;
  weight?: number;
  tracking?: string;
}> = ({ f, start, text, top, size = 30, color, align = "center", opacity = 0.85, cps = 1.6, weight = 500, tracking = "0.01em" }) => {
  if (f < start) return null;
  const shown = typed(f, start, text, cps);
  const done = shown.length >= text.length;
  const doneAt = start + text.length / cps;
  const cursorOn = !done || (f < doneAt + 18 && Math.floor(f / 5) % 2 === 0);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: MARGIN,
        right: MARGIN,
        textAlign: align,
        fontFamily: FONT.mono,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: tracking,
        lineHeight: 1.4,
        color,
        opacity,
      }}
    >
      {shown}
      <span
        style={{
          display: "inline-block",
          width: "0.55em",
          height: "1em",
          marginLeft: "0.08em",
          verticalAlign: "-0.14em",
          background: color,
          opacity: cursorOn ? 1 : 0,
        }}
      />
    </div>
  );
};

// Fade wrapper for groups of text.
export const Fade: React.FC<{ f: number; inAt: number; outAt?: number; children: React.ReactNode }> = ({ f, inAt, outAt, children }) => {
  const o = prog(f, inAt, inAt + 10, ease.outCubic) * (outAt !== undefined ? 1 - prog(f, outAt, outAt + 10, ease.inCubic) : 1);
  if (o <= 0) return null;
  return <div style={{ position: "absolute", inset: 0, opacity: o }}>{children}</div>;
};

// Corner chrome: brand mark (suffix accented), chapter counter that rolls on
// each cut, handle and name. Adapts its ink + accent to the current stage.
export const Chrome: React.FC<{ f: number; stage: string; chapter: number; chapterStart: number; chapterCount: number }> = ({
  f,
  stage,
  chapter,
  chapterStart,
  chapterCount,
}) => {
  const col = inkOn(stage);
  const accent = accentOn(stage);
  const roll = (1 - prog(f - chapterStart, 0, 12, ease.outExpo)) * 100;
  const pad = (n: number) => String(n).padStart(2, "0");
  const base: React.CSSProperties = {
    position: "absolute",
    fontFamily: FONT.mono,
    fontWeight: 700,
    fontSize: 24,
    letterSpacing: "0.12em",
    color: col,
    opacity: 0.8,
  };
  return (
    <>
      <div style={{ ...base, top: 76, left: 64 }}>
        {BRAND.mark.prefix}
        <span style={{ color: accent }}>{BRAND.mark.suffix}</span>
      </div>
      <div style={{ ...base, top: 76, right: 64, height: 32, overflow: "hidden" }}>
        <div style={{ transform: `translateY(${roll}%)` }}>
          {pad(chapter + 1)} / {pad(chapterCount)}
        </div>
      </div>
      <div style={{ ...base, bottom: 70, left: 64, fontWeight: 500, letterSpacing: "0.04em" }}>{BRAND.handle}</div>
      <div style={{ ...base, bottom: 70, right: 64, fontSize: 20 }}>{BRAND.name}</div>
    </>
  );
};
