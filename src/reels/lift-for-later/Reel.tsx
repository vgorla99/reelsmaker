// "Lift for later" — the example reel that ships with ReelsMaker.
// Layer order, bottom to top:
//   stage color -> chapter props (SVG) -> the protagonist -> chapter text ->
//   transitions (floods / border wipe) -> corner chrome -> film grain.
// Chapters are time-gated; a chapter's layers only mount while it's on screen.

import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { MusicBed } from "../../kit/audio";
import { GlobalFonts } from "../../kit/fonts";
import { defineReel } from "../../kit/reel";
import { BorderWipe, CircleFlood, Grain, Protagonist } from "../../kit/svg";
import { Chrome } from "../../kit/text";
import { BRAND, C, FONT, H, W } from "../../kit/theme";
import { FLOOD_ORIGIN, dotState } from "./dot";
import { ChairBack, ChairFront } from "./scenes/Chair";
import { CtaBack, CtaFront } from "./scenes/Cta";
import { HookBack, HookFront } from "./scenes/Hook";
import { ProblemBack, ProblemFront } from "./scenes/Problem";
import { SeesawBack, SeesawFront } from "./scenes/Seesaw";
import { StatBack, StatFront } from "./scenes/Stat";
import { CHAPTERS as STAGES, DURATION, T, bgAt, chapterIndex } from "./timeline";

interface Chapter {
  from: number;
  to: number;
  Back: React.FC<{ f: number }>;
  Front: React.FC<{ f: number }>;
}

// `to` extends each chapter to the frame its outgoing transition fully covers.
const CHAPTERS: readonly Chapter[] = [
  { from: 0, to: T.flood1.cover, Back: HookBack, Front: HookFront },
  { from: T.problem, to: T.flood2.cover, Back: ProblemBack, Front: ProblemFront },
  { from: T.seesaw, to: T.wipe3.cover, Back: SeesawBack, Front: SeesawFront },
  { from: T.chair, to: T.flood4.cover, Back: ChairBack, Front: ChairFront },
  { from: T.stat, to: T.cta, Back: StatBack, Front: StatFront },
  { from: T.cta, to: DURATION, Back: CtaBack, Front: CtaFront },
];

export const LiftForLater: React.FC = () => {
  const f = useCurrentFrame();
  const active = CHAPTERS.filter((c) => f >= c.from && f < c.to);
  const stage = bgAt(f);
  const chapter = chapterIndex(f);
  return (
    <AbsoluteFill style={{ background: stage, fontFamily: FONT.mono }}>
      <GlobalFonts />
      <MusicBed src={BRAND.music} duration={DURATION} />

      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {active.map(({ Back, from }) => (
          <Back key={from} f={f} />
        ))}
        <Protagonist f={f} dot={dotState} />
      </svg>

      {active.map(({ Front, from }) => (
        <AbsoluteFill key={from}>
          <Front f={f} />
        </AbsoluteFill>
      ))}

      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <CircleFlood f={f} start={T.flood1.start} cover={T.flood1.cover} x={FLOOD_ORIGIN.flood1.x} y={FLOOD_ORIGIN.flood1.y} r0={FLOOD_ORIGIN.flood1.r} color={C.primary} />
        <CircleFlood f={f} start={T.flood2.start} cover={T.flood2.cover} x={FLOOD_ORIGIN.flood2.x} y={FLOOD_ORIGIN.flood2.y} r0={FLOOD_ORIGIN.flood2.r} color={C.dark} />
        <BorderWipe f={f} start={T.wipe3.start} cover={T.wipe3.cover} end={T.wipe3.end} color={C.secondary} />
        <CircleFlood f={f} start={T.flood4.start} cover={T.flood4.cover} x={FLOOD_ORIGIN.flood4.x} y={FLOOD_ORIGIN.flood4.y} r0={FLOOD_ORIGIN.flood4.r} color={C.tertiary} />
      </svg>

      <Chrome f={f} stage={stage} chapter={chapter} chapterStart={STAGES[chapter].start} chapterCount={STAGES.length} />
      <Grain f={f} />
    </AbsoluteFill>
  );
};

export const reel = defineReel({
  id: "LiftForLater",
  component: LiftForLater,
  durationInFrames: DURATION,
  // each transition in / covered / out, plus a key pose in every chapter
  reviewFrames: [40, 84, 112, 140, 150, 200, 262, 316, 340, 350, 420, 470, 536, 548, 560, 620, 712, 752, 766, 776, 830, 880, 968, 1000, 1030, 1150],
});
