// Carousels (4:5, 1080x1350) from the plan. One composition per carousel;
// frame N is slide N, so each slide renders as a still. Slide text is
// "HEAD | sub": slide 1 is the cover, the last slide is the call to action.

import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BRAND } from "../brand";
import { GlobalFonts } from "../kit/fonts";
import { Grain } from "../kit/svg";
import { C, FONT } from "../kit/theme";
import { reelId } from "./fromPlan";

export const CW = 1080;
export const CH = 1350;
const PAD = 90;

export interface PlanCarousel {
  id: string;
  slug: string;
  slides: readonly string[];
}

const split = (s: string): [string, string] => {
  const [head, ...rest] = s.split(" | ");
  return [head.trim(), rest.join(" | ").trim()];
};

const Frame: React.FC<{ n: number; total: number; children: React.ReactNode }> = ({ n, total, children }) => (
  <AbsoluteFill style={{ background: C.dark, fontFamily: FONT.display, color: C.light }}>
    <GlobalFonts />
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 62%, ${C.secondary}40 0%, ${C.dark}00 60%)` }} />
    <svg width={CW} height={CH} style={{ position: "absolute", inset: 0, opacity: 0.1 }}>
      {[220, 360, 500].map((r) => (
        <circle key={r} cx={CW / 2} cy={CH * 0.62} r={r} fill="none" stroke={C.primary} strokeWidth={2} />
      ))}
    </svg>
    <div style={{ position: "absolute", top: 64, left: PAD, fontSize: 30, letterSpacing: "0.02em" }}>
      <span style={{ fontWeight: 700 }}>{BRAND.mark.prefix}</span>
      <span style={{ fontWeight: 300 }}>{BRAND.mark.suffix}</span>
    </div>
    <div style={{ position: "absolute", top: 70, right: PAD, fontSize: 24, fontWeight: 700, letterSpacing: "0.12em", opacity: 0.7 }}>
      {String(n + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
    </div>
    <div style={{ position: "absolute", bottom: 60, left: PAD, fontSize: 22, fontWeight: 500, opacity: 0.7 }}>{BRAND.handle}</div>
    {children}
    <Grain f={n} />
  </AbsoluteFill>
);

const Cover: React.FC<{ head: string; sub: string }> = ({ head, sub }) => (
  <div style={{ position: "absolute", left: PAD, right: PAD, top: 300 }}>
    <div style={{ width: 44, height: 44, borderRadius: 22, background: C.primary, boxShadow: `0 0 40px ${C.primary}88`, marginBottom: 48 }} />
    <div style={{ fontWeight: 700, fontSize: 104, lineHeight: 1.05, letterSpacing: "-0.02em" }}>{head}</div>
    {sub ? <div style={{ marginTop: 36, fontWeight: 500, fontSize: 48, color: C.primary }}>{sub}</div> : null}
    <div style={{ marginTop: 120, fontWeight: 500, fontSize: 30, opacity: 0.75 }}>Wischen →</div>
  </div>
);

const Body: React.FC<{ n: number; head: string; sub: string }> = ({ n, head, sub }) => (
  <div style={{ position: "absolute", left: PAD, right: PAD, top: 330 }}>
    <div
      style={{
        width: 96,
        height: 96,
        borderRadius: 48,
        background: C.primary,
        color: C.dark,
        fontWeight: 700,
        fontSize: 44,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 56,
      }}
    >
      {n}
    </div>
    <div style={{ fontWeight: 700, fontSize: 84, lineHeight: 1.08, color: C.primary, letterSpacing: "-0.01em" }}>{head}</div>
    {sub ? <div style={{ marginTop: 32, fontWeight: 500, fontSize: 56, lineHeight: 1.25 }}>{sub}</div> : null}
  </div>
);

const Outro: React.FC<{ head: string; sub: string }> = ({ head, sub }) => (
  <div style={{ position: "absolute", left: PAD, right: PAD, top: 380, textAlign: "center" }}>
    <div style={{ fontWeight: 700, fontSize: 88, lineHeight: 1.08 }}>{head}</div>
    {sub ? <div style={{ marginTop: 28, fontWeight: 500, fontSize: 44, opacity: 0.85 }}>{sub}</div> : null}
    <div
      style={{
        margin: "90px auto 0",
        width: 640,
        height: 120,
        borderRadius: 60,
        background: C.primary,
        color: C.dark,
        fontWeight: 700,
        fontSize: 44,
        letterSpacing: "0.03em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 60px ${C.primary}66`,
      }}
    >
      LINK IN BIO
    </div>
    {sub.startsWith("Ergänzungsfuttermittel") ? null : (
      <div style={{ marginTop: 34, fontWeight: 500, fontSize: 26, opacity: 0.7 }}>Ergänzungsfuttermittel für Hunde.</div>
    )}
  </div>
);

export interface CarouselEntry {
  id: string;
  slides: number;
  component: React.FC;
}

export function carouselEntry(month: string, c: PlanCarousel): CarouselEntry {
  if (c.slides.length < 2 || c.slides.length > 10) throw new Error(`${month} ${c.id}: 2–10 slides (Instagram API limit)`);
  const total = c.slides.length;
  const Carousel: React.FC = () => {
    const n = Math.min(useCurrentFrame(), total - 1);
    const [head, sub] = split(c.slides[n]);
    return (
      <Frame n={n} total={total}>
        {n === 0 ? <Cover head={head} sub={sub} /> : n === total - 1 ? <Outro head={head} sub={sub} /> : <Body n={n} head={head} sub={sub} />}
      </Frame>
    );
  };
  Carousel.displayName = `Carousel(${c.id})`;
  return { id: reelId(month, c.id), slides: total, component: Carousel };
}
