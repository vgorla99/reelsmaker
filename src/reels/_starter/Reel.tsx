// STARTER — copied by `npm run new -- <slug>` into src/reels/<slug>/.
// A small, working 12s reel that shows the whole contract in one file:
// a timeline, ONE protagonist function, chapters (Back = SVG props behind
// the dot, Front = text), and transitions that start from the dot.
//
// Replace everything below with this video's own idea. Keep the kit; never
// reuse another reel's choreography (see README "Every reel is unique").

import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ease, hop, lerp, prog, springIn, squash, tween } from "../../kit/anim";
import { MusicBed } from "../../kit/audio";
import { GlobalFonts } from "../../kit/fonts";
import { type DotState, HIDDEN, circle, pill } from "../../kit/protagonist";
import { defineReel } from "../../kit/reel";
import { BorderWipe, CircleFlood, Grain, Protagonist, Ripple } from "../../kit/svg";
import { Chrome, MaskLine, Typewriter } from "../../kit/text";
import { BRAND, C, FONT, H, W, inkOn } from "../../kit/theme";

// ── timeline ─────────────────────────────────────────────────
const T = {
  flood: { start: 70, cover: 92 }, // 01 -> 02
  two: 92,
  wipe: { start: 196, cover: 216, end: 236 }, // 02 -> 03
  three: 216,
  end: 360,
} as const;
const STAGES = [
  { start: 0, bg: C.dark },
  { start: T.two, bg: C.primary },
  { start: T.three, bg: C.tertiary },
] as const;
const stageAt = (f: number) => STAGES.reduce((i, s, idx) => (f >= s.start ? idx : i), 0);

// ── the protagonist ──────────────────────────────────────────
const FLOOR = 1400;
const R = 46;
const PILL_Y = 1250;

function dot(f: number): DotState {
  if (f < T.flood.start) {
    const y = tween(f, 0, 20, -120, FLOOR - R, ease.inQuad);
    return circle(540, y, R, C.primary, 1, squash(f, 20, 0.32));
  }
  if (f < T.two + 6) return HIDDEN; // the flood IS the dot
  if (f < T.wipe.cover) {
    const born = springIn(f, T.two + 6, true);
    const t = prog(f, T.two + 40, T.two + 64, ease.linear);
    const [x, y] = hop(t, 300, FLOOR - R, 780, FLOOR - R, 260);
    return circle(x, y, R * born, inkOn(C.primary), 0, squash(f, T.two + 64, 0.3));
  }
  const m = prog(f, T.three + 10, T.three + 40, ease.inOutCubic);
  const r = R * springIn(f, T.three, true);
  return pill(540, lerp(960, PILL_Y, m), lerp(2 * r, 620, m), lerp(2 * r, 112, m), C.primary, 1);
}

// ── chapters ─────────────────────────────────────────────────
const One: React.FC<{ f: number }> = ({ f }) => (
  <>
    <MaskLine f={f} inAt={24} top={560} size={150} color={C.light}>
      YOUR
    </MaskLine>
    <MaskLine f={f} inAt={32} top={722} size={150} color={C.primary}>
      HOOK.
    </MaskLine>
  </>
);

const Two: React.FC<{ f: number }> = ({ f }) => (
  <>
    <MaskLine f={f} inAt={T.two + 8} top={420} size={96} color={inkOn(C.primary)}>
      The point,
    </MaskLine>
    <MaskLine f={f} inAt={T.two + 16} top={520} size={96} color={inkOn(C.primary)}>
      shown by the dot.
    </MaskLine>
    <Typewriter f={f} start={T.two + 30} text="Mono captions annotate the action." top={1520} color={inkOn(C.primary)} />
  </>
);

const Three: React.FC<{ f: number }> = ({ f }) => (
  <>
    <MaskLine f={f} inAt={T.three + 36} top={640} size={150} color={C.light}>
      CALL TO
    </MaskLine>
    <MaskLine f={f} inAt={T.three + 44} top={802} size={150} color={C.primary}>
      ACTION.
    </MaskLine>
    <div
      style={{
        position: "absolute",
        left: 540 - 310,
        top: PILL_Y - 56,
        width: 620,
        height: 112,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT.display,
        fontWeight: 700,
        fontSize: 38,
        color: inkOn(C.primary),
        opacity: prog(f, T.three + 40, T.three + 52),
      }}
    >
      FOLLOW {BRAND.handle.toUpperCase()}
    </div>
  </>
);

export const Starter: React.FC = () => {
  const f = useCurrentFrame();
  const i = stageAt(f);
  return (
    <AbsoluteFill style={{ background: STAGES[i].bg }}>
      <GlobalFonts />
      <MusicBed src={BRAND.music} duration={T.end} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {f < T.flood.cover ? <Ripple f={f} at={20} x={540} y={FLOOR} color={C.primary} /> : null}
        <Protagonist f={f} dot={dot} />
      </svg>
      <AbsoluteFill>
        {f < T.flood.cover ? <One f={f} /> : null}
        {f >= T.two && f < T.wipe.cover ? <Two f={f} /> : null}
        {f >= T.three ? <Three f={f} /> : null}
      </AbsoluteFill>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <CircleFlood f={f} start={T.flood.start} cover={T.flood.cover} x={540} y={FLOOR - R} r0={R} color={C.primary} />
        <BorderWipe f={f} start={T.wipe.start} cover={T.wipe.cover} end={T.wipe.end} color={C.secondary} />
      </svg>
      <Chrome f={f} stage={STAGES[i].bg} chapter={i} chapterStart={STAGES[i].start} chapterCount={STAGES.length} />
      <Grain f={f} />
    </AbsoluteFill>
  );
};

export const reel = defineReel({
  id: "Starter",
  component: Starter,
  durationInFrames: T.end,
  reviewFrames: [10, 30, 60, 80, 100, 150, 190, 206, 220, 240, 270, 330],
});
