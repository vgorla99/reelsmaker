// A footage reel from a FootageSpec: stock / own clips and stills under the
// brand motion layer. Layer order, bottom to top:
//   shots (each opens as a circle out of the dot) -> shared grade ->
//   readability scrims -> iris rings -> the dot -> text -> chrome -> grain.

import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ease, prog, tween } from "../kit/anim";
import { MusicBed, VoiceOver } from "../kit/audio";
import { GlobalFonts } from "../kit/fonts";
import type { DotFn } from "../kit/protagonist";
import { type ReelEntry, defineReel } from "../kit/reel";
import { Grain, Protagonist } from "../kit/svg";
import { Chrome } from "../kit/text";
import { C, FONT, H, W } from "../kit/theme";
import { resolveShot } from "./assets";
import { StageView } from "./Blocks";
import { Captions, captionChunks } from "./Captions";
import { makeDot } from "./dot";
import { IRIS_LEN, IRIS_MAX, PAGE_LEN, R } from "./layout";
import { Overlays } from "./Overlays";
import { type FootageSpec, type Shot, type Timing, placeVo, timing, validate } from "./spec";

// One warm, slightly muted look so Pexels, AI clips and stills sit together.
const GRADE = "contrast(1.05) saturate(0.9) sepia(0.08)";

const KenBurns: React.FC<{ shot: Extract<Shot, { kind: "image" }>; f: number; len: number }> = ({ shot, f, len }) => {
  const t = prog(f, 0, len, ease.linear);
  const scale = shot.zoom === "out" ? tween(t, 0, 1, 1.14, 1.02, ease.linear) : tween(t, 0, 1, 1.02, 1.14, ease.linear);
  const d = 40 * (t - 0.5);
  const pan = shot.pan ?? "none";
  const tx = pan === "left" ? -d : pan === "right" ? d : 0;
  const ty = pan === "up" ? -d : pan === "down" ? d : 0;
  return (
    <Img
      src={staticFile(shot.src)}
      style={{ width: "100%", height: "100%", objectFit: "cover", transform: `translate(${tx}px, ${ty}px) scale(${scale})` }}
    />
  );
};

const ShotView: React.FC<{ shot: Shot; len: number }> = ({ shot, len }) => {
  const f = useCurrentFrame(); // local to the shot's <Sequence>
  if (shot.kind === "stage") return <StageView tone={shot.tone} f={f} />;
  if (shot.kind === "image") return <KenBurns shot={shot} f={f} len={len} />;
  return (
    <OffthreadVideo
      src={staticFile(shot.src)}
      trimBefore={shot.trim ?? 0}
      playbackRate={shot.rate ?? 1}
      muted
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  );
};

const shotsOf = (spec: FootageSpec): Shot[] => [...spec.beats.map((b) => b.shot), spec.cta.shot];
// Stage -> stage cuts turn like pages (motion reels); every other cut irises out of the dot.
const isPage = (shots: readonly Shot[], i: number) => i > 0 && shots[i].kind === "stage" && shots[i - 1].kind === "stage";

const Shots: React.FC<{ f: number; spec: FootageSpec; tm: Timing; dot: DotFn }> = ({ f, spec, tm, dot }) => {
  const shots = shotsOf(spec);
  return (
    <>
      {shots.map((shot, i) => {
        const from = tm.starts[i];
        const next = i + 1 < shots.length ? tm.starts[i + 1] : null;
        const until = next === null ? tm.duration : next + (isPage(shots, i + 1) ? PAGE_LEN : IRIS_LEN);
        let clipPath: string | undefined;
        let x = 0;
        let scale = 1;
        let shade = 0;
        let radius = 0;
        if (isPage(shots, i)) {
          const p = prog(f, from, from + PAGE_LEN, ease.inOutCubic); // slides in from the right
          x = (1 - p) * W;
          radius = 48 * (1 - p);
        } else if (i > 0) {
          const o = dot(from); // each shot opens out of wherever the dot sits at its cut
          clipPath = `circle(${tween(f, from, from + IRIS_LEN, R, IRIS_MAX, ease.inOutCubic)}px at ${o.x}px ${o.y}px)`;
        }
        if (next !== null && isPage(shots, i + 1) && f >= next) {
          const p = prog(f, next, next + PAGE_LEN, ease.inOutCubic); // the old page drifts left and sinks
          x = -p * W * 0.3;
          scale = 1 - 0.06 * p;
          shade = 0.55 * p;
        }
        return (
          <Sequence key={from} from={from} durationInFrames={until - from} layout="none">
            <AbsoluteFill
              style={{
                clipPath,
                filter: GRADE,
                transform: x || scale !== 1 ? `translateX(${x}px) scale(${scale})` : undefined,
                borderRadius: radius,
                overflow: "hidden",
                boxShadow: radius > 0 ? `-30px 0 80px ${C.dark}` : undefined,
              }}
            >
              <ShotView shot={shot} len={until - from} />
              {shade > 0 ? <AbsoluteFill style={{ background: C.dark, opacity: shade }} /> : null}
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </>
  );
};

const Scrims: React.FC<{ f: number; ctaAt: number }> = ({ f, ctaAt }) => {
  const dim = prog(f, ctaAt + 4, ctaAt + 18, ease.outCubic) * 0.75; // the CTA shot is a quiet backdrop behind the wordmark
  return (
    <>
      <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${C.dark}D9 0%, ${C.dark}A6 30%, ${C.dark}00 52%)` }} />
      <AbsoluteFill style={{ background: `linear-gradient(to top, ${C.dark}D9 0%, ${C.dark}80 22%, ${C.dark}00 42%)` }} />
      {dim > 0 ? <AbsoluteFill style={{ background: C.dark, opacity: dim }} /> : null}
    </>
  );
};

// A gold ring rides the edge of each opening shot.
const IrisRings: React.FC<{ f: number; tm: Timing; dot: DotFn; shots: readonly Shot[] }> = ({ f, tm, dot, shots }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    {tm.starts.slice(1).map((at, k) => {
      if (f < at || f >= at + IRIS_LEN || isPage(shots, k + 1)) return null;
      const o = dot(at);
      const r = tween(f, at, at + IRIS_LEN, R, IRIS_MAX, ease.inOutCubic);
      return <circle key={at} cx={o.x} cy={o.y} r={r} fill="none" stroke={C.primary} strokeWidth={10} opacity={1 - prog(f, at, at + IRIS_LEN)} />;
    })}
  </svg>
);

// Review frames: the cover, then early / settled / late in every chapter.
function reviewFrames(tm: Timing): number[] {
  const out = [0];
  tm.starts.forEach((s, i) => {
    const len = tm.lengths[i];
    for (const at of [s + 8, s + Math.round(len * 0.55), s + len - 4]) if (at > out[out.length - 1]) out.push(at);
  });
  return out.filter((f) => f < tm.duration);
}

// Library ids -> public/ paths; fails if a clip is too short for its beat + the next iris.
function resolveAssets(spec: FootageSpec, tm: Timing): FootageSpec {
  const onScreen = (i: number) => (i + 1 < tm.starts.length ? tm.starts[i + 1] + IRIS_LEN : tm.duration) - tm.starts[i];
  const n = spec.beats.length;
  return {
    ...spec,
    beats: spec.beats.map((b, i) => ({ ...b, shot: resolveShot(b.shot, onScreen(i), `${spec.id} beat ${i + 1}`) })),
    cta: { ...spec.cta, shot: resolveShot(spec.cta.shot, onScreen(n), `${spec.id} cta`) },
  };
}

const MUSIC_UNDER_VO = 0.18; // bed ~14 dB under the ElevenLabs VO (measured on V06)

export function footageReel(input: FootageSpec): ReelEntry {
  const tm = timing(validate(input));
  const spec = resolveAssets(input, tm);
  const dot = makeDot(spec, tm);
  const vo = spec.vo ? { src: spec.vo.src, lines: placeVo(spec, tm) } : null;
  const chunks = vo && spec.captions ? captionChunks(vo.lines, spec.captions) : [];
  const shots = shotsOf(spec);
  const n = spec.beats.length;

  const Reel: React.FC = () => {
    const f = useCurrentFrame();
    const chapter = tm.starts.filter((s) => f >= s).length - 1;
    return (
      <AbsoluteFill style={{ background: C.dark, fontFamily: FONT.mono }}>
        <GlobalFonts />
        {vo ? <VoiceOver src={vo.src} lines={vo.lines} /> : null}
        {spec.music ? <MusicBed src={spec.music} duration={tm.duration} volume={MUSIC_UNDER_VO} /> : null}
        <Shots f={f} spec={spec} tm={tm} dot={dot} />
        <Scrims f={f} ctaAt={tm.starts[n]} />
        <IrisRings f={f} tm={tm} dot={dot} shots={shots} />
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <Protagonist f={f} dot={dot} />
        </svg>
        <AbsoluteFill>
          <Overlays f={f} spec={spec} tm={tm} />
          <Captions f={f} chunks={chunks} />
        </AbsoluteFill>
        <Chrome f={f} stage={C.dark} chapter={chapter} chapterStart={tm.starts[chapter]} chapterCount={n + 1} />
        <Grain f={f} />
      </AbsoluteFill>
    );
  };
  Reel.displayName = `FootageReel(${spec.id})`;

  return defineReel({ id: spec.id, component: Reel, durationInFrames: tm.duration, reviewFrames: reviewFrames(tm) });
}
