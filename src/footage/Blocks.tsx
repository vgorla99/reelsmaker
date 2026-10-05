// Graphic blocks for the middle band of a beat — what the Line 2 "Motion"
// reels show instead of footage. Each enters a little after its beat opens
// and leaves as the next shot irises in (`out`).

import React from "react";
import { BRAND } from "../brand";
import { ease, prog, springIn } from "../kit/anim";
import { C, FONT } from "../kit/theme";
import { BLOCK_TOP, JAR_BIG, JAR_SMALL, PANEL } from "./layout";
import { Bars, ENTER, Flow, Focus, Ruler, Tabs } from "./MotionBlocks";
import type { Block } from "./spec";

const PILL = { h: 76, gap: 18 };
const VERDICT_INK = { MYTHOS: C.primary, FAKT: "#7FD6A3", GIFTIG: "#FF6B6B" } as const;

const exitOf = (f: number, out: number) => 1 - prog(f, out - 8, out + 6, ease.inOutCubic);

const Stat: React.FC<{ f: number; s: number; value: string; label: string }> = ({ f, s, value, label }) => {
  const n = Number(value);
  const shown = Number.isFinite(n) ? Math.round(n * prog(f, s + ENTER, s + ENTER + 24, ease.outCubic)) : value;
  const lab = prog(f, s + ENTER + 16, s + ENTER + 30, ease.outCubic);
  return (
    <div style={{ position: "absolute", top: BLOCK_TOP + 20, left: 0, right: 0, textAlign: "center", fontFamily: FONT.display }}>
      <div style={{ fontWeight: 700, fontSize: 300, lineHeight: 1, color: C.primary, fontVariantNumeric: "tabular-nums" }}>{shown}</div>
      <div style={{ marginTop: 20, fontWeight: 500, fontSize: 40, color: C.light, opacity: lab, transform: `translateY(${(1 - lab) * 20}px)` }}>{label}</div>
    </div>
  );
};

const List: React.FC<{ f: number; s: number; items: readonly string[] }> = ({ f, s, items }) => {
  const cols = items.length > 3 ? 2 : 1;
  const colW = cols === 2 ? (1080 - 2 * PANEL.x - 20) / 2 : 1080 - 2 * PANEL.x;
  return (
    <>
      {items.map((item, k) => {
        const col = cols === 2 ? k % 2 : 0;
        const row = cols === 2 ? Math.floor(k / 2) : k;
        const p = springIn(f, s + ENTER + 7 * k);
        return (
          <div
            key={item}
            style={{
              position: "absolute",
              left: PANEL.x + col * (colW + 20),
              width: colW,
              top: BLOCK_TOP + 20 + row * (PILL.h + PILL.gap),
              height: PILL.h,
              borderRadius: PILL.h / 2,
              background: `${C.tertiary}E6`,
              border: `2px solid ${C.primary}66`,
              display: "flex",
              alignItems: "center",
              paddingLeft: 34,
              gap: 18,
              fontFamily: FONT.display,
              fontWeight: 500,
              fontSize: cols === 2 ? 34 : 40,
              color: C.light,
              opacity: p,
              transform: `translateX(${(1 - p) * (col === 0 ? -60 : 60)}px)`,
            }}
          >
            <span style={{ width: 16, height: 16, borderRadius: 8, background: C.primary, flexShrink: 0 }} />
            {item}
          </div>
        );
      })}
    </>
  );
};

type Side = { title: string; items: readonly string[] };

const Compare: React.FC<{ f: number; s: number; left: Side; right: Side }> = ({ f, s, left, right }) => {
  const card = (side: Side, k: number) => {
    const p = springIn(f, s + ENTER + 8 * k);
    const w = (1080 - 2 * PANEL.x - 24) / 2;
    return (
      <div
        key={side.title}
        style={{
          position: "absolute",
          left: PANEL.x + k * (w + 24),
          width: w,
          top: BLOCK_TOP + 10,
          height: 330,
          borderRadius: 32,
          background: `${C.tertiary}E6`,
          border: `2px solid ${k === 0 ? `${C.light}44` : `${C.primary}88`}`,
          padding: "34px 30px",
          fontFamily: FONT.display,
          opacity: p,
          transform: `translateY(${(1 - p) * 60}px)`,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 44, color: k === 0 ? C.light : C.primary, marginBottom: 18 }}>{side.title}</div>
        {side.items.map((it) => (
          <div key={it} style={{ fontWeight: 500, fontSize: 32, color: C.light, opacity: 0.9, lineHeight: 1.5 }}>
            {it}
          </div>
        ))}
      </div>
    );
  };
  return (
    <>
      {card(left, 0)}
      {card(right, 1)}
    </>
  );
};

const Verdict: React.FC<{ f: number; s: number; verdict: keyof typeof VERDICT_INK }> = ({ f, s, verdict }) => {
  const t = prog(f, s + ENTER, s + ENTER + 8, ease.inQuad); // slam down
  const settle = springIn(f, s + ENTER + 8, true);
  const scale = f < s + ENTER + 8 ? 1.8 - 0.8 * t : 1 + 0.06 * (1 - settle);
  const ink = VERDICT_INK[verdict];
  return (
    <div style={{ position: "absolute", top: BLOCK_TOP + 90, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: t }}>
      <div
        style={{
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: 130,
          letterSpacing: "0.06em",
          color: ink,
          border: `10px solid ${ink}`,
          borderRadius: 24,
          padding: "10px 44px",
          transform: `rotate(-8deg) scale(${scale})`,
        }}
      >
        {verdict}
      </div>
    </div>
  );
};

// A product jar: dark body + lid, a secondary→tertiary label band. Mark from BRAND; label/sub from the block.
const Jar: React.FC<{ f: number; s: number; small: boolean; label: string; sub: string }> = ({ f, s, small, label, sub }) => {
  const g = small ? JAR_SMALL : JAR_BIG;
  const p = springIn(f, s + ENTER, true);
  const k = g.w / JAR_BIG.w; // type scale
  const lidH = 58 * k;
  return (
    <div
      style={{
        position: "absolute",
        left: g.x - g.w / 2,
        top: g.top,
        width: g.w,
        height: g.h,
        transform: `scale(${0.2 + 0.8 * p})`,
        transformOrigin: "50% 0%",
        opacity: Math.min(1, p * 2),
        fontFamily: FONT.display,
      }}
    >
      <div style={{ position: "absolute", left: -10 * k, right: -10 * k, top: 0, height: lidH, borderRadius: 20 * k, background: "#000", borderBottom: `2px solid ${C.primary}66` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: lidH - 6, bottom: 0, borderRadius: 34 * k, background: "#0B0D10", boxShadow: `0 30px 60px ${C.dark}` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: lidH + 22 * k, textAlign: "center", fontSize: 26 * k, color: C.light }}>
        <span style={{ fontWeight: 700 }}>{BRAND.mark.prefix}</span>
        <span style={{ fontWeight: 300 }}>{BRAND.mark.suffix}</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: lidH + 70 * k,
          height: 150 * k,
          background: `linear-gradient(160deg, ${C.secondary} 0%, ${C.tertiary} 70%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8 * k,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 30 * k, color: C.light }}>{label}</div>
        <div style={{ width: "60%", height: 2, background: C.primary }} />
        <div style={{ fontWeight: 500, fontSize: 17 * k, letterSpacing: "0.2em", color: C.primary }}>{sub}</div>
      </div>
    </div>
  );
};

export const BlockView: React.FC<{ f: number; s: number; out: number; block: Block; withRows: boolean }> = ({ f, s, out, block, withRows }) => {
  if (block.type === "none" || f < s + ENTER - 2) return null;
  const o = exitOf(f, out);
  if (o <= 0) return null;
  let body: React.ReactNode;
  switch (block.type) {
    case "stat":
      body = <Stat f={f} s={s} value={block.value} label={block.label} />;
      break;
    case "list":
      body = <List f={f} s={s} items={block.items} />;
      break;
    case "compare":
      body = <Compare f={f} s={s} left={block.left} right={block.right} />;
      break;
    case "verdict":
      body = <Verdict f={f} s={s} verdict={block.verdict} />;
      break;
    case "jar":
      body = <Jar f={f} s={s} small={withRows} label={block.label ?? "PRODUCT NAME"} sub={block.sub ?? "DESCRIPTOR"} />;
      break;
    case "bars":
      body = <Bars f={f} s={s} items={block.items} />;
      break;
    case "focus":
      body = <Focus f={f} s={s} out={out} rows={block.rows} />;
      break;
    case "flow":
      body = <Flow f={f} s={s} from={block.from} to={block.to} />;
      break;
    case "tabs":
      body = <Tabs f={f} s={s} out={out} tabs={block.tabs} />;
      break;
    case "ruler":
      body = <Ruler f={f} s={s} min={block.min} max={block.max} mark={block.mark} label={block.label} unit={block.unit} />;
      break;
  }
  // Every block comes into focus on entry and drifts up out of focus on exit.
  const blur = (1 - prog(f, s + ENTER - 2, s + ENTER + 14, ease.outCubic)) * 8 + (1 - o) * 10;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o, transform: `translateY(${-(1 - o) * 70}px)`, filter: blur > 0.2 ? `blur(${blur}px)` : undefined }}>
      {body}
    </div>
  );
};

// Stage backgrounds for footage-free beats: a tone, a soft light pool and slow gold rings.
const TONES = { dark: C.dark, navy: C.tertiary, teal: "#2C5563" } as const;

export const StageView: React.FC<{ tone: keyof typeof TONES; f: number }> = ({ tone, f }) => {
  const base = TONES[tone];
  const wave = Math.sin(((f % 600) / 600) * Math.PI * 2);
  return (
    <div style={{ position: "absolute", inset: 0, background: base, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% ${58 + 6 * wave}%, ${C.secondary}55 0%, ${base}00 55%)` }} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 0.12 }}>
        {[260, 420, 580, 740].map((r, i) => (
          <circle key={r} cx={540} cy={1180} r={r + 20 * Math.sin(((f % 600) / 600) * Math.PI * 2 + i)} fill="none" stroke={C.primary} strokeWidth={2} />
        ))}
      </svg>
    </div>
  );
};
