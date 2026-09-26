// The beat-based reel composition: 6 scenes on the BEATS timeline, stitched
// by WipeTransitions and threaded together by one persistent MorphBar.
// Everything visual comes from props.brand (BrandConfig) + the beat content.

import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { BEATS, REEL_HEIGHT } from "./beats";
import { GlobalFonts } from "./fonts";
import {
  BarCompare,
  type BarKeyframe,
  Backdrop,
  BuildUpWords,
  CTA_PILL,
  GrowthLine,
  KineticWords,
  MorphBar,
  OrbitRing,
  Particles,
  RadialProgress,
  Seesaw,
  ShortMark,
  StepTrack,
  TopProgress,
  WipeTransition,
  Wordmark,
  Words,
  beatOpacity,
  countUp,
  fadeUp,
  popIn,
  readableOn,
  stepSlotRect,
} from "./motion";
import type { BrandConfig, ReelEntryProps, ReelProps } from "./types";

// ── MorphBar paths ───────────────────────────────────────────
// classic: underline under the kicker -> vertical rule beside the copy, held
// through every point, fading out at the CTA.
const CLASSIC_BAR_KEYFRAMES: readonly BarKeyframe[] = [
  { beatStart: BEATS.hook.start, rect: { x: 64, y: 860, w: 220, h: 6, opacity: 1 } },
  { beatStart: BEATS.problem.start, rect: { x: 64, y: 830, w: 6, h: 260, opacity: 1 } },
  { beatStart: BEATS.pointA.start, rect: { x: 64, y: 830, w: 6, h: 260, opacity: 1 } },
  { beatStart: BEATS.pointB.start, rect: { x: 64, y: 830, w: 6, h: 260, opacity: 1 } },
  { beatStart: BEATS.stat.start, rect: { x: 64, y: 830, w: 6, h: 260, opacity: 1 } },
  { beatStart: BEATS.cta.start, rect: { x: 64, y: 830, w: 6, h: 0, opacity: 0 } },
];

// journey: underline -> vertical rule -> lifts into a 3-step chapter marker
// that advances one slot per point (01 -> 02 -> 03) -> drops and expands
// into the CTA button itself. One element, one continuous path.
const JOURNEY_BAR_KEYFRAMES: readonly BarKeyframe[] = [
  { beatStart: BEATS.hook.start, rect: { x: 64, y: 860, w: 220, h: 6, opacity: 1 } },
  { beatStart: BEATS.problem.start, rect: { x: 64, y: 830, w: 6, h: 260, opacity: 1 } },
  { beatStart: BEATS.pointA.start, rect: stepSlotRect(0), dur: 26 },
  { beatStart: BEATS.pointB.start, rect: stepSlotRect(1) },
  { beatStart: BEATS.stat.start, rect: stepSlotRect(2) },
  { beatStart: BEATS.cta.start, rect: { ...CTA_PILL, opacity: 1, radius: CTA_PILL.h / 2 }, dur: 30 },
];

interface SceneProps {
  frame: number;
  p: ReelProps;
  brand: BrandConfig;
  accent: string;
  start: number;
  opacity: number;
}

const kickerStyle = (brand: BrandConfig, accent: string): React.CSSProperties => ({
  fontFamily: brand.fonts.body,
  fontWeight: 800,
  fontSize: 22,
  letterSpacing: "0.2em",
  color: accent,
  textTransform: "uppercase",
  marginBottom: 18,
});

const cardStyle = (brand: BrandConfig, accent: string): React.CSSProperties => ({
  background: brand.colors.card,
  border: `1px solid ${brand.colors.line}`,
  borderLeft: `5px solid ${accent}`,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
});

const statLabelStyle = (brand: BrandConfig): React.CSSProperties => ({
  fontFamily: brand.fonts.body,
  fontWeight: 700,
  fontSize: 17,
  color: brand.colors.body,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  maxWidth: 240,
});

// ── scenes ───────────────────────────────────────────────────
const HookScene: React.FC<SceneProps & { fps: number }> = ({ frame, fps, p, brand, accent, opacity }) => (
  <AbsoluteFill style={{ opacity, justifyContent: "center", padding: "0 64px" }}>
    <div style={{ ...fadeUp(frame, 4, 16), marginBottom: 22 }}>
      <div style={{ ...kickerStyle(brand, accent), fontSize: 24, letterSpacing: "0.22em", marginBottom: 0 }}>{p.kicker}</div>
    </div>
    <div style={{ height: 34 }} /> {/* space reserved for the morphing bar */}
    {p.hookTypeVariant === "buildup" ? (
      <BuildUpWords
        text={p.hook}
        frame={frame}
        start={12}
        stagger={14}
        accent={accent}
        style={{ fontFamily: brand.fonts.headline, fontSize: 100, lineHeight: 1.05, color: brand.colors.ink, letterSpacing: "0.01em" }}
      />
    ) : (
      <KineticWords
        text={p.hook}
        frame={frame}
        fps={fps}
        start={12}
        stagger={6}
        timings={p.hookTimings}
        style={{ fontFamily: brand.fonts.headline, fontSize: 104, lineHeight: 1.02, color: brand.colors.ink, letterSpacing: "0.01em" }}
      />
    )}
  </AbsoluteFill>
);

const ProblemScene: React.FC<SceneProps> = ({ frame, p, brand, accent, start, opacity }) => (
  <AbsoluteFill style={{ opacity, padding: "0 64px", justifyContent: "center" }}>
    <div style={{ marginLeft: 40 }}>
      <div style={{ ...fadeUp(frame, start + 4, 14), ...kickerStyle(brand, accent) }}>WHY</div>
      {p.problemTypeVariant === "buildup" ? (
        <BuildUpWords
          text={p.problemLine}
          frame={frame}
          start={start + 10}
          stagger={7}
          accent={accent}
          style={{ fontFamily: brand.fonts.body, fontWeight: 700, fontSize: 46, lineHeight: 1.28, color: brand.colors.ink }}
        />
      ) : (
        <Words
          text={p.problemLine}
          frame={frame}
          start={start + 10}
          stagger={3}
          dur={12}
          timings={p.bodyTimings}
          style={{ fontFamily: brand.fonts.body, fontWeight: 700, fontSize: 50, lineHeight: 1.26, color: brand.colors.ink }}
        />
      )}
    </div>
  </AbsoluteFill>
);

// Title + body + a chart card: the shared layout for POINT A and POINT B.
const PointLayout: React.FC<SceneProps & { title: string; body: string; children: React.ReactNode }> = ({
  frame,
  brand,
  accent,
  start,
  opacity,
  title,
  body,
  children,
}) => (
  <AbsoluteFill style={{ opacity, padding: "0 64px", justifyContent: "center" }}>
    <div style={{ marginLeft: 40 }}>
      <div style={{ ...fadeUp(frame, start + 4, 14), fontFamily: brand.fonts.headline, fontSize: 46, color: brand.colors.ink, marginBottom: 14 }}>
        {title}
      </div>
      <Words
        text={body}
        frame={frame}
        start={start + 12}
        stagger={3}
        dur={12}
        style={{ fontFamily: brand.fonts.body, fontWeight: 600, fontSize: 32, lineHeight: 1.3, color: brand.colors.body }}
      />
      <div style={{ ...fadeUp(frame, start + 55, 18), ...cardStyle(brand, accent), marginTop: 40, padding: "28px 32px", gap: 28 }}>{children}</div>
    </div>
  </AbsoluteFill>
);

const PointAScene: React.FC<SceneProps> = (props) => {
  const { frame, p, brand, accent, start } = props;
  return (
    <PointLayout {...props} title={p.pointATitle} body={p.pointABody}>
      {p.pointAVariant === "seesaw" ? (
        <Seesaw
          frame={frame}
          start={start + 65}
          accent={accent}
          brand={brand}
          leftLabel={p.pointALeftLabel ?? ""}
          rightLabel={p.pointARightLabel ?? ""}
        />
      ) : (
        <>
          <RadialProgress frame={frame} start={start + 65} accent={accent} brand={brand} percent={p.pointAStatTo ?? 0} />
          <div style={statLabelStyle(brand)}>{p.pointAStatLabel}</div>
        </>
      )}
    </PointLayout>
  );
};

const PointBScene: React.FC<SceneProps> = (props) => {
  const { frame, p, brand, accent, start } = props;
  return (
    <PointLayout {...props} title={p.pointBTitle} body={p.pointBBody}>
      {p.pointBVariant === "orbit" ? (
        <>
          <OrbitRing frame={frame} start={start + 65} accent={accent} brand={brand} percent={p.pointBStatTo ?? 0} />
          <div style={statLabelStyle(brand)}>{p.pointBStatLabel}</div>
        </>
      ) : (
        <BarCompare
          frame={frame}
          start={start + 65}
          accent={accent}
          brand={brand}
          beforeLabel={p.pointBBeforeLabel ?? ""}
          beforeValue={p.pointBBeforeValue ?? 0}
          afterLabel={p.pointBAfterLabel ?? ""}
          afterValue={p.pointBAfterValue ?? 0}
          unit={p.pointBUnit ?? ""}
        />
      )}
    </PointLayout>
  );
};

const StatScene: React.FC<SceneProps> = ({ frame, p, brand, accent, start, opacity }) => {
  const stat = countUp(frame, start + 40, 45, p.statFrom, p.statTo);
  return (
    <AbsoluteFill style={{ opacity, padding: "0 64px", justifyContent: "center" }}>
      <div style={{ marginLeft: 40 }}>
        <div style={{ ...fadeUp(frame, start + 4, 14), ...kickerStyle(brand, accent) }}>THE RESULT</div>
        <div style={{ ...fadeUp(frame, start + 20, 18), ...cardStyle(brand, accent), padding: "32px 36px", gap: 32 }}>
          <GrowthLine frame={frame} start={start + 35} accent={accent} brand={brand} />
          <div>
            <div style={{ fontFamily: brand.fonts.headline, fontSize: 72, color: accent, lineHeight: 1 }}>
              {stat}
              {p.statSuffix}
            </div>
            <div style={{ ...statLabelStyle(brand), fontSize: 18, marginTop: 8, maxWidth: 260 }}>{p.statLabel}</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CtaHeadline: React.FC<{ p: ReelProps; brand: BrandConfig }> = ({ p, brand }) => (
  <>
    <div style={{ fontFamily: brand.fonts.headline, fontSize: 34, letterSpacing: "0.1em", color: brand.colors.ink, marginBottom: 20 }}>
      <ShortMark brand={brand} />
    </div>
    <div style={{ fontFamily: brand.fonts.headline, fontSize: 88, color: brand.colors.ink, lineHeight: 1.02, marginBottom: 20 }}>{p.ctaText}</div>
    <div style={{ fontFamily: brand.fonts.body, fontWeight: 600, fontSize: 28, color: brand.colors.body }}>{p.ctaSub}</div>
  </>
);

const pillTextStyle = (brand: BrandConfig, bg: string): React.CSSProperties => ({
  color: readableOn(bg, brand.colors.ink),
  fontFamily: brand.fonts.body,
  fontWeight: 800,
  fontSize: 24,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
});

// classic CTA: centered stack with its own pill button.
const CtaScene: React.FC<SceneProps & { fps: number }> = ({ frame, fps, p, brand, accent, start, opacity }) => (
  <AbsoluteFill style={{ opacity, alignItems: "center", justifyContent: "center", padding: "0 64px" }}>
    <div style={{ ...popIn(frame, fps, start + 4), textAlign: "center" }}>
      <CtaHeadline p={p} brand={brand} />
      <div
        style={{
          ...popIn(frame, fps, start + 16),
          ...pillTextStyle(brand, accent),
          marginTop: 40,
          display: "inline-block",
          background: accent,
          borderRadius: 999,
          padding: "18px 46px",
        }}
      >
        Follow {brand.handle}
      </div>
    </div>
  </AbsoluteFill>
);

// journey CTA: the headline stack sits above CTA_PILL; the button background
// IS the MorphBar (drawn above the scenes), so the label is drawn in its own
// layer on top of the bar (CtaPillLabel), not here.
const JourneyCtaScene: React.FC<SceneProps & { fps: number }> = ({ frame, fps, p, brand, start, opacity }) => (
  <AbsoluteFill style={{ opacity }}>
    <div
      style={{
        ...popIn(frame, fps, start + 4),
        position: "absolute",
        left: 64,
        right: 64,
        bottom: REEL_HEIGHT - CTA_PILL.y + 48,
        textAlign: "center",
      }}
    >
      <CtaHeadline p={p} brand={brand} />
    </div>
  </AbsoluteFill>
);

const CtaPillLabel: React.FC<{ frame: number; fps: number; brand: BrandConfig; barColor: string; start: number }> = ({
  frame,
  fps,
  brand,
  barColor,
  start,
}) => (
  <div
    style={{
      ...popIn(frame, fps, start + 26),
      ...pillTextStyle(brand, barColor),
      position: "absolute",
      left: CTA_PILL.x,
      top: CTA_PILL.y,
      width: CTA_PILL.w,
      height: CTA_PILL.h,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    Follow {brand.handle}
  </div>
);

// ── root component ───────────────────────────────────────────
export const Reel: React.FC<ReelProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const { brand } = props;
  const [accent0, accent1, accent2] = brand.colors.accents;
  const isJourney = props.morphPath === "journey";
  const base = { frame, p: props, brand };
  const op = (b: keyof typeof BEATS) => beatOpacity(frame, BEATS[b].start, BEATS[b].end, b === "cta");

  return (
    <AbsoluteFill style={{ fontFamily: brand.fonts.body }}>
      <GlobalFonts />
      {props.voiceoverSrc ? <Audio src={staticFile(props.voiceoverSrc)} /> : null}
      {props.musicSrc ? <Audio src={staticFile(props.musicSrc)} volume={props.musicVolume ?? 0.25} /> : null}
      <Backdrop frame={frame} accent={accent0} brand={brand} />
      <Particles frame={frame} accent={accent0} brand={brand} />

      <HookScene {...base} fps={fps} accent={accent0} start={BEATS.hook.start} opacity={op("hook")} />
      <ProblemScene {...base} accent={accent0} start={BEATS.problem.start} opacity={op("problem")} />
      <PointAScene {...base} accent={accent1} start={BEATS.pointA.start} opacity={op("pointA")} />
      <PointBScene {...base} accent={accent2} start={BEATS.pointB.start} opacity={op("pointB")} />
      <StatScene {...base} accent={accent1} start={BEATS.stat.start} opacity={op("stat")} />
      {isJourney ? (
        <JourneyCtaScene {...base} fps={fps} accent={accent2} start={BEATS.cta.start} opacity={op("cta")} />
      ) : (
        <CtaScene {...base} fps={fps} accent={accent2} start={BEATS.cta.start} opacity={op("cta")} />
      )}

      {isJourney ? (
        <StepTrack
          frame={frame}
          brand={brand}
          accent={accent0}
          stepStarts={[BEATS.pointA.start, BEATS.pointB.start, BEATS.stat.start]}
          hideAt={BEATS.cta.start}
        />
      ) : null}
      <MorphBar frame={frame} accent={accent0} keyframes={isJourney ? JOURNEY_BAR_KEYFRAMES : CLASSIC_BAR_KEYFRAMES} />
      {isJourney ? <CtaPillLabel frame={frame} fps={fps} brand={brand} barColor={accent0} start={BEATS.cta.start} /> : null}

      <WipeTransition frame={frame} at={BEATS.problem.start} color={accent0} dir={1} />
      <WipeTransition frame={frame} at={BEATS.pointA.start} color={accent1} dir={-1} />
      <WipeTransition frame={frame} at={BEATS.pointB.start} color={accent2} dir={1} />
      <WipeTransition frame={frame} at={BEATS.stat.start} color={accent1} dir={-1} />
      <WipeTransition frame={frame} at={BEATS.cta.start} color={accent2} dir={1} />

      <TopProgress frame={frame} duration={durationInFrames} accent={accent0} brand={brand} />
      <Wordmark frame={frame} brand={brand} />
    </AbsoluteFill>
  );
};

// CLI entry: the reel nested under `reel` so --props replaces it wholesale
// (see ReelEntryProps in src/types.ts for why).
export const ReelEntry: React.FC<ReelEntryProps> = ({ reel }) => <Reel {...reel} />;
