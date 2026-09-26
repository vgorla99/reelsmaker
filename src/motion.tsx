// Brand-agnostic motion vocabulary. Every primitive takes its colors/fonts
// from a BrandConfig (or an explicit accent) — nothing brand-specific is
// hardcoded here. Kept structurally identical to the original hardcoded-brand engine it was extracted from.
//
// All animation is a pure function of `frame` (no Math.random(), no
// timers), so every render of the same props is identical.

import React from "react";
import { AbsoluteFill, interpolate, spring } from "remotion";
import { REEL_DURATION, REEL_WIDTH } from "./beats";
import type { BrandConfig, WordTiming } from "./types";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const XFADE = 20; // frames each beat's own content takes to settle in

// ── easing / tween helpers ───────────────────────────────────
export function fadeUp(frame: number, start: number, dur = 16, dist = 24) {
  const opacity = interpolate(frame, [start, start + dur], [0, 1], CLAMP);
  const y = interpolate(frame, [start, start + dur], [dist, 0], CLAMP);
  return { opacity, transform: `translateY(${y}px)` };
}

export function popIn(frame: number, fps: number, start: number) {
  const s = spring({ frame: frame - start, fps, config: { damping: 14, stiffness: 180 } });
  const clamped = Math.min(s, 1);
  return { opacity: clamped, transform: `scale(${0.85 + clamped * 0.15})` };
}

// Beat-level crossfade: fades in over XFADE frames, holds, fades out over
// XFADE frames (or holds through the end for the final beat). The seam at
// each boundary is additionally covered by a WipeTransition panel, so this
// fade mostly just keeps content from popping instantly.
export function beatOpacity(frame: number, start: number, end: number, isLast = false) {
  if (isLast) return interpolate(frame, [start, start + XFADE], [0, 1], CLAMP);
  return interpolate(frame, [start, start + XFADE, end - XFADE, end], [0, 1, 1, 0], CLAMP);
}

export function countUp(frame: number, start: number, dur: number, from: number, to: number) {
  const t = interpolate(frame, [start, start + dur], [0, 1], CLAMP);
  const eased = 1 - Math.pow(1 - t, 3);
  return Math.round(from + (to - from) * eased);
}

// Picks ink or white for text sitting on a solid `hex` background (WCAG
// relative luminance). Replaces a hardcoded "is the accent yellow?" check.
export function readableOn(hex: string, ink: string): string {
  const n = parseInt(hex.slice(1), 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const lum = 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  return lum > 0.45 ? ink : "#ffffff";
}

// ── typography ───────────────────────────────────────────────
// Stagger-fade — calmer body copy, read at speed.
export const Words: React.FC<{
  text: string;
  frame: number;
  start: number;
  stagger?: number;
  dur?: number;
  style?: React.CSSProperties;
  timings?: WordTiming[];
}> = ({ text, frame, start, stagger = 4, dur = 14, style, timings }) => {
  const lines = text.split("\n");
  let wordIndex = 0;
  return (
    <>
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", flexWrap: "wrap" }}>
          {line.split(" ").map((w, wi) => {
            const i = wordIndex++;
            const s = timings?.[i] ? timings[i].startFrame : start + i * stagger;
            const opacity = interpolate(frame, [s, s + dur], [0, 1], CLAMP);
            const y = interpolate(frame, [s, s + dur], [22, 0], CLAMP);
            return (
              <span key={wi} style={{ ...style, opacity, transform: `translateY(${y}px)`, marginRight: "0.28em", display: "inline-block" }}>
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </>
  );
};

// Kinetic scale-pop — each word spring-pops in place. Headline default.
export const KineticWords: React.FC<{
  text: string;
  frame: number;
  fps: number;
  start: number;
  stagger?: number;
  style?: React.CSSProperties;
  timings?: WordTiming[];
}> = ({ text, frame, fps, start, stagger = 6, style, timings }) => {
  const lines = text.split("\n");
  let wordIndex = 0;
  return (
    <>
      {lines.map((line, li) => (
        <div key={li} style={{ display: "flex", flexWrap: "wrap" }}>
          {line.split(" ").map((w, wi) => {
            const i = wordIndex++;
            const s = timings?.[i] ? timings[i].startFrame : start + i * stagger;
            const spr = spring({ frame: frame - s, fps, config: { damping: 12, stiffness: 200 } });
            const clamped = Math.min(spr, 1);
            return (
              <span
                key={wi}
                style={{
                  ...style,
                  opacity: clamped,
                  transform: `scale(${0.4 + clamped * 0.6})`,
                  transformOrigin: "left center",
                  marginRight: "0.28em",
                  display: "inline-block",
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      ))}
    </>
  );
};

// Accumulating build-up — words stack ("Don't" -> "Don't be" -> "Don't be
// perfect."); the newest word is accent-colored while it's "current", then
// settles. Treats "\n" as a space — for short, naturally-wrapping phrases.
export const BuildUpWords: React.FC<{
  text: string;
  frame: number;
  start: number;
  stagger?: number;
  style?: React.CSSProperties;
  accent: string;
}> = ({ text, frame, start, stagger = 10, style, accent }) => {
  const words = text.replace(/\n/g, " ").split(" ");
  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      {words.map((w, i) => {
        const s = start + i * stagger;
        const revealT = interpolate(frame, [s, s + 10], [0, 1], CLAMP);
        const isCurrent = frame < s + stagger + 4;
        const settleT = interpolate(frame, [s + stagger, s + stagger + 16], [1, 0.6], CLAMP);
        const opacity = revealT * (isCurrent ? 1 : settleT);
        const scale = interpolate(frame, [s, s + 10], [0.82, 1], CLAMP);
        return (
          <span
            key={i}
            style={{
              ...style,
              opacity,
              transform: `scale(${scale})`,
              transformOrigin: "left center",
              color: isCurrent ? accent : style?.color,
              marginRight: "0.28em",
              display: "inline-block",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// ── charts / icons ───────────────────────────────────────────
// 1. GrowthLine — line chart drawn on via strokeDashoffset, dot rides the tip.
export const GrowthLine: React.FC<{ frame: number; start: number; accent: string; brand: BrandConfig }> = ({ frame, start, accent, brand }) => {
  const points: [number, number][] = [
    [0, 96],
    [110, 78],
    [220, 82],
    [330, 40],
    [430, 14],
  ];
  const d = `M${points.map((p) => p.join(",")).join(" L")}`;
  const PATH_LEN = 470;
  const progress = interpolate(frame, [start, start + 55], [0, 1], CLAMP);
  const dotOpacity = progress > 0.03 ? 1 : 0;
  const dotX = interpolate(progress, [0, 1], [0, 430]);
  const dotY = interpolate(progress, [0, 1], [96, 14]);
  return (
    <svg width={440} height={110} viewBox="0 0 440 110" style={{ overflow: "visible" }}>
      <path d={d} fill="none" stroke={brand.colors.line} strokeWidth={4} strokeLinecap="round" />
      <path
        d={d}
        fill="none"
        stroke={accent}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={PATH_LEN}
        strokeDashoffset={PATH_LEN * (1 - progress)}
      />
      <circle cx={dotX} cy={dotY} r={9} fill={accent} opacity={dotOpacity} />
    </svg>
  );
};

// 2. RadialProgress — % ring with a counting center label.
export const RadialProgress: React.FC<{ frame: number; start: number; accent: string; percent: number; brand: BrandConfig }> = ({
  frame,
  start,
  accent,
  percent,
  brand,
}) => {
  const size = 200;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const t = interpolate(frame, [start, start + 55], [0, 1], CLAMP);
  const eased = 1 - Math.pow(1 - t, 3);
  const value = Math.round(percent * eased);
  const offset = c * (1 - (percent * eased) / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={brand.colors.line} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={accent}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="53%" textAnchor="middle" dominantBaseline="middle" fontFamily={brand.fonts.headline} fontSize={44} fill={brand.colors.ink}>
        {value}%
      </text>
    </svg>
  );
};

// 3. BarCompare — before/after bars, staggered grow + counting labels.
export const BarCompare: React.FC<{
  frame: number;
  start: number;
  accent: string;
  brand: BrandConfig;
  beforeLabel: string;
  beforeValue: number;
  afterLabel: string;
  afterValue: number;
  unit: string;
}> = ({ frame, start, accent, brand, beforeLabel, beforeValue, afterLabel, afterValue, unit }) => {
  const H = 170;
  const maxV = Math.max(beforeValue, afterValue, 1) * 1.15;
  const tBefore = interpolate(frame, [start, start + 35], [0, 1], CLAMP);
  const tAfter = interpolate(frame, [start + 18, start + 58], [0, 1], CLAMP);
  const hBefore = (beforeValue / maxV) * H * tBefore;
  const hAfter = (afterValue / maxV) * H * tAfter;
  const vBefore = Math.round(beforeValue * tBefore);
  const vAfter = Math.round(afterValue * tAfter);
  const labelStyle: React.CSSProperties = {
    fontFamily: brand.fonts.body,
    fontWeight: 700,
    fontSize: 13,
    color: brand.colors.faint,
    marginTop: 10,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };
  const column = (value: number, h: number, barColor: string, valueColor: string, label: string) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: H + 60 }}>
      <div style={{ fontFamily: brand.fonts.headline, fontSize: 26, color: valueColor, marginBottom: 6 }}>
        {value}
        {unit}
      </div>
      <div style={{ width: 56, height: Math.max(h, 2), background: barColor, borderRadius: 8 }} />
      <div style={labelStyle}>{label}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 32, height: H + 60 }}>
      {column(vBefore, hBefore, brand.colors.line, brand.colors.body, beforeLabel)}
      {column(vAfter, hAfter, accent, accent, afterLabel)}
    </div>
  );
};

// 4. OrbitRing — center % with a ring of dots, some "lit", slowly rotating.
// Reads as "X out of a group" rather than a plain progress bar.
export const OrbitRing: React.FC<{ frame: number; start: number; accent: string; percent: number; brand: BrandConfig; total?: number }> = ({
  frame,
  start,
  accent,
  percent,
  brand,
  total = 20,
}) => {
  const size = 200;
  const R = 86;
  const center = size / 2;
  const t = interpolate(frame, [start, start + 55], [0, 1], CLAMP);
  const eased = 1 - Math.pow(1 - t, 3);
  const value = Math.round(percent * eased);
  const litCount = Math.round((percent / 100) * total * eased);
  const rotate = interpolate(frame, [start, start + 500], [0, 25]);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      {Array.from({ length: total }).map((_, i) => {
        const angle = (i / total) * Math.PI * 2 + (rotate * Math.PI) / 180;
        const dx = center + R * Math.cos(angle);
        const dy = center + R * Math.sin(angle);
        const dotDelay = start + i * 1.6;
        const dotT = interpolate(frame, [dotDelay, dotDelay + 12], [0, 1], CLAMP);
        const lit = i < litCount;
        return <circle key={i} cx={dx} cy={dy} r={lit ? 7 : 4.5} fill={lit ? accent : brand.colors.line} opacity={dotT} />;
      })}
      <text x="50%" y="53%" textAnchor="middle" dominantBaseline="middle" fontFamily={brand.fonts.headline} fontSize={40} fill={brand.colors.ink}>
        {value}%
      </text>
    </svg>
  );
};

// 5. Seesaw — one heavier item (accent dot) outweighing a cluster. For
// contrarian/"this beats that" points where a chart would be overkill.
export const Seesaw: React.FC<{ frame: number; start: number; accent: string; brand: BrandConfig; leftLabel: string; rightLabel: string }> = ({
  frame,
  start,
  accent,
  brand,
  leftLabel,
  rightLabel,
}) => {
  const t = interpolate(frame, [start, start + 40], [0, 1], CLAMP);
  const eased = 1 - Math.pow(1 - t, 3);
  const tilt = -12 * eased; // left (accent/heavier) side tips down
  const pivotX = 130;
  const pivotY = 108;
  const dotOpacity = interpolate(frame, [start, start + 20], [0, 1], CLAMP);
  return (
    <svg width={260} height={150} viewBox="0 0 260 150" style={{ overflow: "visible" }}>
      <polygon points={`${pivotX - 16},146 ${pivotX + 16},146 ${pivotX},112`} fill={brand.colors.line} />
      <g transform={`rotate(${tilt} ${pivotX} ${pivotY})`}>
        <rect x={pivotX - 110} y={pivotY - 4} width={220} height={8} rx={4} fill={brand.colors.ink} />
        <circle cx={pivotX - 85} cy={pivotY - 8} r={16} fill={accent} opacity={dotOpacity} />
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={pivotX + 70 + i * 15}
            cy={pivotY - 4 + (i % 2) * 6}
            r={7}
            fill={brand.colors.line}
            opacity={interpolate(frame, [start + 6 + i * 4, start + 26 + i * 4], [0, 1], CLAMP)}
          />
        ))}
      </g>
      <text x={pivotX - 85} y={64} textAnchor="middle" fontFamily={brand.fonts.body} fontWeight={700} fontSize={14} fill={brand.colors.body} opacity={eased}>
        {leftLabel}
      </text>
      <text x={pivotX + 92} y={64} textAnchor="middle" fontFamily={brand.fonts.body} fontWeight={700} fontSize={14} fill={brand.colors.faint} opacity={eased}>
        {rightLabel}
      </text>
    </svg>
  );
};

// ── persistent chrome (present the whole video) ──────────────
export const TopProgress: React.FC<{ frame: number; duration: number; accent: string; brand: BrandConfig }> = ({ frame, duration, accent, brand }) => {
  const w = interpolate(frame, [0, duration], [0, REEL_WIDTH], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 6, background: brand.colors.line }}>
      <div style={{ width: w, height: "100%", background: accent }} />
    </div>
  );
};

export const ShortMark: React.FC<{ brand: BrandConfig }> = ({ brand }) => (
  <>
    {brand.shortMark.prefix}
    <span style={{ color: brand.colors.accents[0] }}>{brand.shortMark.suffix}</span>
  </>
);

export const Wordmark: React.FC<{ frame: number; brand: BrandConfig }> = ({ frame, brand }) => {
  const opacity = interpolate(frame, [4, 24], [0, 1], CLAMP);
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 72,
          left: 64,
          opacity,
          fontFamily: brand.fonts.headline,
          fontSize: 34,
          letterSpacing: "0.08em",
          color: brand.colors.ink,
        }}
      >
        <ShortMark brand={brand} />
      </div>
      <div style={{ position: "absolute", bottom: 64, left: 64, right: 64, opacity, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: brand.fonts.body, fontWeight: 600, fontSize: 24, color: brand.colors.faint }}>{brand.handle}</span>
        <span
          style={{
            fontFamily: brand.fonts.body,
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: "0.08em",
            color: brand.colors.faint,
            textTransform: "uppercase",
          }}
        >
          {brand.name}
        </span>
      </div>
    </>
  );
};

// Soft blurred color blobs — the base "texture" layer.
export const Backdrop: React.FC<{ frame: number; accent: string; brand: BrandConfig }> = ({ frame, accent, brand }) => {
  const drift = interpolate(frame, [0, REEL_DURATION], [0, 60]);
  return (
    <AbsoluteFill style={{ background: brand.colors.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: accent,
          opacity: 0.06,
          filter: "blur(120px)",
          top: -200 + drift * 0.3,
          right: -220,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: brand.colors.accents[2],
          opacity: 0.05,
          filter: "blur(140px)",
          bottom: -240,
          left: -180 - drift * 0.2,
        }}
      />
    </AbsoluteFill>
  );
};

// Ambient drifting particles — "something moving everywhere, all the time".
// Deterministic (seeded by index), so every render is identical.
const PARTICLE_SEEDS = Array.from({ length: 13 }).map((_, i) => ({
  x: ((i * 173 + 60) % 1000) + 40,
  y: ((i * 311 + 140) % 1750) + 60,
  r: 3 + (i % 4) * 2,
  sp: 0.008 + (i % 5) * 0.004,
}));

export const Particles: React.FC<{ frame: number; accent: string; brand: BrandConfig }> = ({ frame, accent, brand }) => (
  <AbsoluteFill style={{ overflow: "hidden" }}>
    {PARTICLE_SEEDS.map((p, i) => {
      const dx = Math.sin(frame * p.sp + i) * 18;
      const dy = Math.cos(frame * p.sp * 0.7 + i) * 14;
      const pulse = 0.3 + 0.25 * Math.sin(frame * p.sp * 1.3 + i * 2);
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x + dx,
            top: p.y + dy,
            width: p.r * 2,
            height: p.r * 2,
            borderRadius: "50%",
            background: i % 3 === 0 ? accent : brand.colors.faint,
            opacity: Math.max(pulse, 0.06),
            filter: "blur(1px)",
          }}
        />
      );
    })}
  </AbsoluteFill>
);

// ── shared-element morph (FLIP-style) ────────────────────────
// ONE persistent element that reshapes between beats instead of each scene
// drawing its own — the throughline that makes the reel read as one
// continuous edit. Keyframes are absolute 1080x1920 rects keyed to beat
// starts; `radius` lets it become a pill, `dur` sets that move's length.
export interface BarRect {
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
  radius?: number; // default 3
}
export interface BarKeyframe {
  beatStart: number;
  rect: BarRect;
  dur?: number; // frames to morph into this rect, default BAR_TRANSITION
}
export const BAR_TRANSITION = 22;
const BAR_RADIUS = 3;

export function currentBarRect(frame: number, keyframes: readonly BarKeyframe[]): Required<BarRect> {
  let idx = 0;
  for (let i = 0; i < keyframes.length; i++) {
    if (frame >= keyframes[i].beatStart) idx = i;
  }
  const cur = keyframes[idx];
  const prev = idx > 0 ? keyframes[idx - 1] : cur;
  const t = interpolate(frame, [cur.beatStart, cur.beatStart + (cur.dur ?? BAR_TRANSITION)], [0, 1], CLAMP);
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
  const lerp = (a: number, b: number) => interpolate(eased, [0, 1], [a, b]);
  return {
    x: lerp(prev.rect.x, cur.rect.x),
    y: lerp(prev.rect.y, cur.rect.y),
    w: lerp(prev.rect.w, cur.rect.w),
    h: lerp(prev.rect.h, cur.rect.h),
    opacity: lerp(prev.rect.opacity, cur.rect.opacity),
    radius: lerp(prev.rect.radius ?? BAR_RADIUS, cur.rect.radius ?? BAR_RADIUS),
  };
}

export const MorphBar: React.FC<{ frame: number; accent: string; keyframes: readonly BarKeyframe[] }> = ({ frame, accent, keyframes }) => {
  const rect = currentBarRect(frame, keyframes);
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        background: accent,
        borderRadius: rect.radius,
        opacity: rect.opacity,
      }}
    />
  );
};

// ── journey-path geometry (shared by MorphBar keyframes + StepTrack) ──
// A 3-slot chapter marker under the wordmark, and the CTA button rect.
// Keeping these as constants means the morph bar lands exactly on them by
// construction — no per-script pixel tuning.
export const STEP_SLOT = { x0: 64, y: 140, w: 110, h: 6, gap: 16 } as const;
export function stepSlotRect(i: number): BarRect {
  return { x: STEP_SLOT.x0 + i * (STEP_SLOT.w + STEP_SLOT.gap), y: STEP_SLOT.y, w: STEP_SLOT.w, h: STEP_SLOT.h, opacity: 1 };
}
export const CTA_PILL = { x: 240, y: 1180, w: 600, h: 92 } as const;

// Chapter-marker track: three faint slots + "01/02/03" labels, visible
// during the point/stat beats. The MorphBar slides slot-to-slot over it,
// so the persistent element doubles as a progress indicator.
export const StepTrack: React.FC<{
  frame: number;
  brand: BrandConfig;
  accent: string;
  stepStarts: readonly [number, number, number];
  hideAt: number;
}> = ({ frame, brand, accent, stepStarts, hideAt }) => {
  const opacity = interpolate(frame, [stepStarts[0], stepStarts[0] + XFADE, hideAt - 10, hideAt], [0, 1, 1, 0], CLAMP);
  let active = 0;
  stepStarts.forEach((s, i) => {
    if (frame >= s) active = i;
  });
  return (
    <div style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
      {stepStarts.map((_, i) => {
        const r = stepSlotRect(i);
        return (
          <React.Fragment key={i}>
            <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 3, background: brand.colors.line }} />
            <div
              style={{
                position: "absolute",
                left: r.x,
                top: r.y + 18,
                fontFamily: brand.fonts.body,
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: "0.12em",
                color: i === active ? accent : brand.colors.faint,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ── wipe transition ──────────────────────────────────────────
// A solid panel sweeps in from one edge, fully covers the frame for a few
// frames around `at`, then exits the opposite edge revealing the next beat
// already underneath — the "solid color panel cut" instead of a hard cut.
export const WipeTransition: React.FC<{ frame: number; at: number; color: string; dir: 1 | -1; width?: number }> = ({
  frame,
  at,
  color,
  dir,
  width = 15,
}) => {
  const from = dir === 1 ? -REEL_WIDTH : REEL_WIDTH;
  const to = dir === 1 ? REEL_WIDTH : -REEL_WIDTH;
  const x = interpolate(frame, [at - width, at - 3, at + 3, at + width], [from, 0, 0, to], CLAMP);
  return <AbsoluteFill style={{ transform: `translateX(${x}px)`, background: color, pointerEvents: "none" }} />;
};
