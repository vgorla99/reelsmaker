// The text layer of a footage reel. Each chapter's words exit as the next
// clip opens. The hook is already set on frame 0 — that frame is the cover.

import React from "react";
import { ease, prog, springIn } from "../kit/anim";
import { MaskLine, Typewriter } from "../kit/text";
import { C, FONT, inkOn } from "../kit/theme";
import { BlockView } from "./Blocks";
import { CTA_MORPH, rowHop } from "./dot";
import { BULLET_X, BUTTON, CENTER_TOP, HOOK_TOP, PANEL, ROW_H, ROW_Y, SAFE_CAPTION_Y, TITLE_BIG, TITLE_MAX, TITLE_TOP, titleSize } from "./layout";
import type { Beat, Cta, FootageSpec, Row, Timing } from "./spec";
import { Wordmark } from "./Wordmark";

const COVER = -20; // an inAt this far before frame 0 means "fully in on frame 0"

const Title: React.FC<{ f: number; lines: readonly [string, string]; top: number; max: number; inAt: number; outAt: number }> = ({ f, lines, top, max, inAt, outAt }) => {
  const size = titleSize(lines, max);
  return (
    <>
      <MaskLine f={f} inAt={inAt} outAt={outAt} top={top} size={size} color={C.light}>
        {lines[0]}
      </MaskLine>
      <MaskLine f={f} inAt={inAt + 8} outAt={outAt} top={top + Math.round(size * 1.18)} size={size} color={C.primary}>
        {lines[1]}
      </MaskLine>
    </>
  );
};

// "1250 mg" counts up from 0; anything else just appears.
const RowValue: React.FC<{ f: number; land: number; value: string; opacity: number }> = ({ f, land, value, opacity }) => {
  const m = /^(\d+)(.*)$/.exec(value);
  const shown = m ? `${Math.round(Number(m[1]) * prog(f, land, land + 14, ease.outCubic))}${m[2]}` : value;
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: PANEL.x + 44,
        fontFamily: FONT.display,
        fontWeight: 700,
        fontSize: 56,
        color: C.primary,
        fontVariantNumeric: "tabular-nums",
        opacity,
      }}
    >
      {shown}
    </div>
  );
};

const Rows: React.FC<{ f: number; s: number; out: number; rows: readonly Row[] }> = ({ f, s, out, rows }) => {
  const panelIn = springIn(f, s + 12);
  const panelOut = 1 - prog(f, out, out + 8, ease.inCubic);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: PANEL.x,
          right: PANEL.x,
          top: PANEL.top,
          height: 40 + rows.length * ROW_H, // sized to its rows
          borderRadius: 36,
          background: `${C.tertiary}E6`,
          border: `2px solid ${C.primary}55`,
          opacity: panelIn * panelOut,
          transform: `scale(${0.94 + 0.06 * panelIn})`,
        }}
      />
      {rows.map((r, k) => {
        const land = s + rowHop(k).land;
        return (
          <React.Fragment key={r.label}>
            {f >= land + 6 && f < out ? (
              <svg width={60} height={60} style={{ position: "absolute", left: BULLET_X - 30, top: ROW_Y[k] - 30 }}>
                <circle cx={30} cy={30} r={11 * springIn(f, land + 6)} fill={C.primary} />
              </svg>
            ) : null}
            <MaskLine f={f} inAt={land - 4} outAt={out} top={ROW_Y[k] - 28} left={BULLET_X + 50} size={48} color={C.light} weight={500}>
              {r.label}
            </MaskLine>
            {r.value && f >= land && f < out + 6 ? (
              <div style={{ position: "absolute", top: ROW_Y[k] - 34, left: 0, right: 0 }}>
                <RowValue f={f} land={land} value={r.value} opacity={panelOut} />
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

const BeatText: React.FC<{ f: number; beat: Beat; s: number; out: number; hook: boolean; captioned: boolean }> = ({ f, beat, s, out, hook, captioned }) => {
  const inAt = hook ? COVER : s + 20;
  // A stage beat with nothing in the middle: the title takes the centre, bigger (also the motion cover).
  const centered = beat.shot.kind === "stage" && !beat.rows && (!beat.block || beat.block.type === "none");
  const noteAt = beat.rows ? s + rowHop(beat.rows.length - 1).land + 10 : hook ? 36 : s + 44;
  return (
    <>
      <Title f={f} lines={beat.title} top={centered ? CENTER_TOP : hook ? HOOK_TOP : TITLE_TOP} max={centered ? TITLE_BIG : TITLE_MAX} inAt={inAt} outAt={out} />
      {beat.block ? <BlockView f={f} s={s} out={out} block={beat.block} withRows={Boolean(beat.rows)} /> : null}
      {beat.rows ? <Rows f={f} s={s} out={out} rows={beat.rows} /> : null}
      {/* Spoken captions replace a beat's note (the CTA's "Ergänzungsfuttermittel" note stays). */}
      {beat.note && !captioned && f < out ? <Typewriter f={f} start={noteAt} text={beat.note} top={SAFE_CAPTION_Y} color={C.light} /> : null}
    </>
  );
};

const CtaText: React.FC<{ f: number; cta: Cta; s: number }> = ({ f, cta, s }) => {
  const done = s + CTA_MORPH.end;
  return (
    <>
      <Wordmark f={f} inAt={s + 12} top={560} size={150} color={C.light} sub={cta.sub} subColor={C.primary} />
      <div
        style={{
          position: "absolute",
          left: BUTTON.x - BUTTON.w / 2,
          top: BUTTON.y - BUTTON.h / 2,
          width: BUTTON.w,
          height: BUTTON.h,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT.display,
          fontWeight: 700,
          fontSize: 48,
          letterSpacing: "0.03em",
          color: inkOn(C.primary),
          opacity: prog(f, done - 4, done + 8),
        }}
      >
        {cta.button}
      </div>
      {cta.note ? <Typewriter f={f} start={done + 12} text={cta.note} top={BUTTON.y + BUTTON.h / 2 + 50} color={C.light} /> : null}
    </>
  );
};

export const Overlays: React.FC<{ f: number; spec: FootageSpec; tm: Timing }> = ({ f, spec, tm }) => {
  const n = spec.beats.length;
  return (
    <>
      {spec.beats.map((beat, i) => {
        const s = tm.starts[i];
        const out = tm.starts[i + 1];
        if (f < s || f >= out + 10) return null;
        return <BeatText key={s} f={f} beat={beat} s={s} out={out} hook={i === 0} captioned={Boolean(spec.captions)} />;
      })}
      {f >= tm.starts[n] ? <CtaText f={f} cta={spec.cta} s={tm.starts[n]} /> : null}
    </>
  );
};
