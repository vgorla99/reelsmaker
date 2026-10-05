// Motion library for the Line 2 "Motion" reels: chart morph, glass focus
// list, flowing paths, tabs -> panels and a range ruler. All live in the
// block band (y 1010–1350) and take only real values — label figures or
// numbers the script itself says. Nothing here invents data.

import React from "react";
import { ease, mix, prog, springIn } from "../kit/anim";
import { C, FONT, W } from "../kit/theme";
import { PANEL } from "./layout";

export const ENTER = 26; // frames after the beat start (shared with Blocks.tsx)

const GLASS: React.CSSProperties = {
  position: "absolute",
  borderRadius: 36,
  background: `linear-gradient(160deg, ${C.secondary}55 0%, ${C.tertiary}E6 60%)`,
  border: `2px solid ${C.light}26`,
  boxShadow: `0 30px 60px ${C.dark}AA`,
  overflow: "hidden",
  fontFamily: FONT.display,
};

// Continuous index 0..n-1 that steps through n items over [t0, t1], easing between steps.
function stepper(f: number, t0: number, t1: number, n: number): number {
  const step = Math.max(12, (t1 - t0) / n);
  let pos = 0;
  for (let k = 1; k < n; k++) pos += prog(f, t0 + step * k - 7, t0 + step * k + 7, ease.inOutCubic);
  return pos;
}
const nearness = (pos: number, k: number) => 1 - Math.min(1, Math.abs(pos - k));

// ── Chart morph: bars grow in turn, values count up on top ─────────────
const BAR = { base: 1296, maxH: 200, w: 170, gap: 44 };

export const Bars: React.FC<{ f: number; s: number; items: readonly { label: string; value: number; unit?: string }[] }> = ({ f, s, items }) => {
  const max = Math.max(...items.map((it) => it.value));
  const n = items.length;
  const w = Math.min(BAR.w, (W - 2 * PANEL.x - BAR.gap * (n - 1)) / n);
  const x0 = (W - (n * w + (n - 1) * BAR.gap)) / 2;
  return (
    <>
      {items.map((it, k) => {
        const p = prog(f, s + ENTER + 6 * k, s + ENTER + 6 * k + 24, ease.outCubic);
        const h = Math.max(12, (BAR.maxH * it.value) / max) * p;
        const x = x0 + k * (w + BAR.gap);
        const text: React.CSSProperties = { position: "absolute", left: x - 50, width: w + 100, textAlign: "center", fontFamily: FONT.display, opacity: Math.min(1, p * 1.5) };
        return (
          <React.Fragment key={it.label}>
            <div style={{ position: "absolute", left: x, width: w, top: BAR.base - BAR.maxH, height: BAR.maxH, borderRadius: 20, background: `${C.light}12` }} />
            <div
              style={{
                position: "absolute",
                left: x,
                width: w,
                top: BAR.base - h,
                height: h,
                borderRadius: 20,
                background: `linear-gradient(180deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                boxShadow: `0 0 30px ${C.primary}44`,
              }}
            />
            <div style={{ ...text, top: BAR.base - h - 62, fontWeight: 700, fontSize: 44, color: C.primary, fontVariantNumeric: "tabular-nums" }}>
              {Math.round(it.value * p)}
              {it.unit ? ` ${it.unit}` : ""}
            </div>
            <div style={{ ...text, top: BAR.base + 14, fontWeight: 500, fontSize: 28, color: C.light }}>{it.label}</div>
          </React.Fragment>
        );
      })}
    </>
  );
};

// ── Glass focus: a card of rows, a gold highlight walks down them ──────
const FOCUS = { top: 1030, rowH: 86, pad: 22 };

export const Focus: React.FC<{ f: number; s: number; out: number; rows: readonly { label: string; value: string }[] }> = ({ f, s, out, rows }) => {
  const card = springIn(f, s + ENTER);
  const t0 = s + ENTER + 14;
  const pos = stepper(f, t0, out - 8, rows.length);
  const hl = prog(f, t0 - 4, t0 + 8, ease.outCubic);
  return (
    <div
      style={{
        ...GLASS,
        left: PANEL.x,
        right: PANEL.x,
        top: FOCUS.top,
        height: 2 * FOCUS.pad + rows.length * FOCUS.rowH,
        opacity: card,
        transform: `translateY(${(1 - card) * 50}px) scale(${0.96 + 0.04 * card})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          top: FOCUS.pad + pos * FOCUS.rowH + 6,
          height: FOCUS.rowH - 12,
          borderRadius: 22,
          background: `${C.primary}24`,
          border: `2px solid ${C.primary}`,
          opacity: hl,
        }}
      />
      {rows.map((r, k) => {
        const near = nearness(pos, k) * hl;
        const rin = springIn(f, s + ENTER + 4 + 6 * k);
        return (
          <div
            key={r.label}
            style={{
              position: "absolute",
              left: 44,
              right: 44,
              top: FOCUS.pad + k * FOCUS.rowH,
              height: FOCUS.rowH,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: rin * (0.45 + 0.55 * Math.max(near, 1 - hl)),
              transform: `translateX(${(1 - rin) * -40}px)`,
            }}
          >
            <span style={{ fontWeight: 500, fontSize: 38, color: C.light }}>{r.label}</span>
            <span style={{ fontWeight: 700, fontSize: 38, color: mix(C.light, C.primary, near) }}>{r.value}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── Flowing paths: sources on the left draw curves into one gold node ──
const FLOW = { top: 1030, h: 300, srcL: PANEL.x, srcR: 400, dstL: 640, dstR: W - PANEL.x, nodeH: 80 };

type P = [number, number];
function bez(t: number, a: P, b: P, c: P, d: P): P {
  const u = 1 - t;
  const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
  return [k[0] * a[0] + k[1] * b[0] + k[2] * c[0] + k[3] * d[0], k[0] * a[1] + k[1] * b[1] + k[2] * c[1] + k[3] * d[1]];
}

const Node: React.FC<{ x: number; y: number; w: number; text: string; gold: boolean; p: number }> = ({ x, y, w, text, gold, p }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y - FLOW.nodeH / 2,
      width: w,
      height: FLOW.nodeH,
      borderRadius: FLOW.nodeH / 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      fontFamily: FONT.display,
      fontWeight: gold ? 700 : 500,
      fontSize: gold ? 38 : 34,
      color: gold ? C.dark : C.light,
      background: gold ? C.primary : `${C.tertiary}E6`,
      border: gold ? "none" : `2px solid ${C.light}33`,
      boxShadow: gold ? `0 0 40px ${C.primary}66` : "none",
      opacity: Math.min(1, p * 2),
      transform: `scale(${0.6 + 0.4 * p})`,
    }}
  >
    {gold ? null : <span style={{ width: 14, height: 14, borderRadius: 7, background: C.primary }} />}
    {text}
  </div>
);

export const Flow: React.FC<{ f: number; s: number; from: readonly string[]; to: string }> = ({ f, s, from, to }) => {
  const n = from.length;
  const cy = FLOW.top + FLOW.h / 2;
  const gap = n === 2 ? 130 : 105;
  const ys = from.map((_, k) => cy + (k - (n - 1) / 2) * gap);
  const draw = prog(f, s + ENTER + 14, s + ENTER + 36, ease.inOutCubic);
  const land = springIn(f, s + ENTER + 32, true);
  const mid = (FLOW.srcR + FLOW.dstL) / 2;
  const curves = ys.map((y): [P, P, P, P] => [
    [FLOW.srcR, y],
    [mid, y],
    [mid, cy],
    [FLOW.dstL, cy],
  ]);
  const flowing = f - (s + ENTER + 36);
  return (
    <>
      <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
        {curves.map(([a, b, c, d], k) => (
          <React.Fragment key={from[k]}>
            <path
              d={`M${a[0]} ${a[1]} C${b[0]} ${b[1]} ${c[0]} ${c[1]} ${d[0]} ${d[1]}`}
              fill="none"
              stroke={C.primary}
              strokeWidth={5}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - draw}
              opacity={0.75}
            />
            {flowing > 0
              ? [0, 0.5].map((phase) => {
                  const t = (((flowing / 32 + phase + k * 0.17) % 1) + 1) % 1;
                  const [x, y] = bez(t, a, b, c, d);
                  return <circle key={phase} cx={x} cy={y} r={9} fill={C.primary} opacity={Math.sin(Math.PI * t)} />;
                })
              : null}
          </React.Fragment>
        ))}
      </svg>
      {from.map((txt, k) => (
        <Node key={txt} x={FLOW.srcL} y={ys[k]} w={FLOW.srcR - FLOW.srcL} text={txt} gold={false} p={springIn(f, s + ENTER + 6 * k)} />
      ))}
      <Node x={FLOW.dstL} y={cy} w={FLOW.dstR - FLOW.dstL} text={to} gold p={land} />
    </>
  );
};

// ── Tabs -> panels: a pill indicator slides, panels slide like pages ────
const TABS = { top: 1030, tabW: 300, tabH: 80, panelTop: 1140, panelH: 190 };

export const Tabs: React.FC<{ f: number; s: number; out: number; tabs: readonly { title: string; text: string }[] }> = ({ f, s, out, tabs }) => {
  const n = tabs.length;
  const barW = TABS.tabW * n + 16;
  const x0 = (W - barW) / 2;
  const pos = stepper(f, s + ENTER + 6, out - 6, n);
  const bar = springIn(f, s + ENTER);
  const panel = springIn(f, s + ENTER + 8);
  return (
    <>
      <div
        style={{
          ...GLASS,
          left: x0,
          width: barW,
          top: TABS.top,
          height: TABS.tabH + 16,
          borderRadius: (TABS.tabH + 16) / 2,
          opacity: bar,
          transform: `translateY(${(1 - bar) * -30}px)`,
        }}
      >
        <div style={{ position: "absolute", left: 8 + pos * TABS.tabW, top: 8, width: TABS.tabW, height: TABS.tabH, borderRadius: TABS.tabH / 2, background: C.primary }} />
        {tabs.map((t, k) => (
          <div
            key={t.title}
            style={{
              position: "absolute",
              left: 8 + k * TABS.tabW,
              top: 8,
              width: TABS.tabW,
              height: TABS.tabH,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 36,
              color: mix(C.light, C.dark, nearness(pos, k)),
            }}
          >
            {t.title}
          </div>
        ))}
      </div>
      <div style={{ ...GLASS, left: PANEL.x, right: PANEL.x, top: TABS.panelTop, height: TABS.panelH, opacity: panel, transform: `translateY(${(1 - panel) * 40}px)` }}>
        {tabs.map((t, k) => {
          const d = k - pos;
          return (
            <div
              key={t.title}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: Math.max(0, 1 - Math.abs(d) * 1.4),
                transform: `translateX(${d * 520}px)`,
              }}
            >
              <div style={{ fontWeight: 500, fontSize: 30, letterSpacing: "0.12em", color: C.primary }}>{t.title.toUpperCase()}</div>
              <div style={{ fontWeight: 700, fontSize: 52, color: C.light }}>{t.text}</div>
            </div>
          );
        })}
      </div>
    </>
  );
};

// ── Ruler: a scale draws in, a gold range grows, a bubble names it ─────
const RULER = { x0: 130, x1: 950, y: 1250 };

export const Ruler: React.FC<{ f: number; s: number; min: number; max: number; mark: readonly [number, number]; label: string; unit: string }> = ({
  f,
  s,
  min,
  max,
  mark,
  label,
  unit,
}) => {
  const X = (v: number) => RULER.x0 + ((RULER.x1 - RULER.x0) * (v - min)) / (max - min);
  const draw = prog(f, s + ENTER, s + ENTER + 18, ease.outCubic);
  const grow = prog(f, s + ENTER + 20, s + ENTER + 36, ease.inOutCubic);
  const bubble = springIn(f, s + ENTER + 32, true);
  const a = X(mark[0]);
  const b = Math.max(X(mark[1]), a + 24);
  const every = max - min > 10 ? 2 : 1;
  const ticks = Array.from({ length: max - min + 1 }, (_, k) => min + k);
  const cx = (a + b) / 2;
  const value = mark[0] === mark[1] ? `${mark[0]} ${unit}` : `${mark[0]}–${mark[1]} ${unit}`;
  return (
    <>
      <svg width={W} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={RULER.x0} y1={RULER.y} x2={RULER.x0 + (RULER.x1 - RULER.x0) * draw} y2={RULER.y} stroke={C.light} strokeOpacity={0.5} strokeWidth={4} strokeLinecap="round" />
        {ticks.map((v) => {
          const at = s + ENTER + 18 * ((v - min) / (max - min));
          const shown = prog(f, at, at + 6);
          const major = (v - min) % every === 0;
          return <line key={v} x1={X(v)} y1={RULER.y - (major ? 18 : 10) * shown} x2={X(v)} y2={RULER.y + (major ? 18 : 10) * shown} stroke={C.light} strokeOpacity={0.6} strokeWidth={3} />;
        })}
        <rect x={a} y={RULER.y - 16} width={(b - a) * grow} height={32} rx={16} fill={C.primary} opacity={grow > 0 ? 1 : 0} />
        <line x1={cx} y1={RULER.y - 22} x2={cx} y2={RULER.y - 22 - 46 * bubble} stroke={C.primary} strokeWidth={3} />
      </svg>
      {ticks
        .filter((v) => (v - min) % every === 0)
        .map((v) => (
          <div
            key={v}
            style={{
              position: "absolute",
              left: X(v) - 40,
              width: 80,
              top: RULER.y + 30,
              textAlign: "center",
              fontFamily: FONT.display,
              fontWeight: 500,
              fontSize: 28,
              color: v >= mark[0] && v <= mark[1] ? C.primary : C.light,
              opacity: draw * 0.85,
            }}
          >
            {v}
          </div>
        ))}
      <div
        style={{
          position: "absolute",
          left: cx - 220,
          width: 440,
          top: RULER.y - 196,
          height: 128,
          borderRadius: 28,
          background: `${C.tertiary}F2`,
          border: `2px solid ${C.primary}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT.display,
          opacity: Math.min(1, bubble * 2),
          transform: `translateY(${(1 - bubble) * 30}px) scale(${0.8 + 0.2 * bubble})`,
        }}
      >
        <div style={{ fontWeight: 500, fontSize: 30, color: C.primary }}>{label}</div>
        <div style={{ fontWeight: 700, fontSize: 54, color: C.light }}>{value}</div>
      </div>
    </>
  );
};
