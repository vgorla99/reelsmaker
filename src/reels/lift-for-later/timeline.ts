// Every cut, flood and chapter in one place. All scene code reads from here,
// so retiming the reel is a one-file change.

import { C } from "../../kit/theme";

export const T = {
  // 01 HOOK — dot drops, headline builds, dot tossed like a coin ("pension")
  toss: 92,
  land: 128,
  flood1: { start: 132, cover: 154 }, // dot swells into a primary-colored world

  // 02 PROBLEM — primary stage, ink dot shrinks per decade, fails the stairs
  problem: 154,
  flood2: { start: 334, cover: 354 }, // ink dot floods back to dark

  // 03 STRENGTH BEATS STEPS — seesaw
  seesaw: 354,
  wipe3: { start: 528, cover: 548, end: 568 }, // secondary frame-border wipe

  // 04 CHAIR-STAND TEST — light stage, reps, capsules
  chair: 548,
  flood4: { start: 758, cover: 778 }, // last capsule dot floods to dark

  // 05 STAT — orbit ring, 17% arc, flower bloom
  stat: 778,
  statExit: 950,

  // 06 CTA — sun, morphs into the button
  cta: 975,
  end: 1200,
} as const;

export const DURATION = T.end; // 40s

// Stage color per chapter — the palette walks dark -> primary -> dark ->
// light -> tertiary (secondary arrives via the frame wipe and the "after" data).
export const CHAPTERS: readonly { start: number; bg: string }[] = [
  { start: 0, bg: C.dark },
  { start: T.problem, bg: C.primary },
  { start: T.seesaw, bg: C.dark },
  { start: T.chair, bg: C.light },
  { start: T.stat, bg: C.tertiary },
  { start: T.cta, bg: C.tertiary },
];

export function chapterIndex(f: number): number {
  let i = 0;
  CHAPTERS.forEach((c, idx) => {
    if (f >= c.start) i = idx;
  });
  return i;
}

export const bgAt = (f: number) => CHAPTERS[chapterIndex(f)].bg;
