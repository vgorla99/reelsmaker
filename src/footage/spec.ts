// Line 1 "Footage" reels are data, not code: a FootageSpec lists the beats
// (one shot + one headline each) and the CTA; <FootageReel> choreographs the
// brand motion layer over them the way a hand-built reel does.
//
// Frame 0 is the cover: the hook headline is already set when the video
// starts (TikTok's API posts can't pick a cover, so the first frame is it).

import type { VoLine } from "../kit/audio";
import type { CaptionLine } from "./Captions";
import { FPS } from "../kit/theme";

export type Shot =
  // A video clip in public/ (or a library asset id). `trim` = frames skipped at its start; `rate` < 1 slows it.
  | { kind: "video"; src: string; trim?: number; rate?: number }
  // A still in public/ (or a library asset id), animated with a slow Ken Burns push.
  | { kind: "image"; src: string; zoom?: "in" | "out"; pan?: "left" | "right" | "up" | "down" | "none" }
  // No footage: a brand-colour stage (Line 2 "Motion" reels). All tones take light text.
  | { kind: "stage"; tone: "dark" | "navy" | "teal" };

export interface Row {
  label: string;
  value?: string; // e.g. "1250 mg" — counts up when it starts with a number
}

// A graphic in the middle of the frame (mostly for stage beats).
export type Block =
  | { type: "none" }
  | { type: "stat"; value: string; label: string } // a big number that counts up
  | { type: "list"; items: readonly string[] } // 2–5 short items
  | { type: "compare"; left: { title: string; items: readonly string[] }; right: { title: string; items: readonly string[] } }
  | { type: "verdict"; verdict: "MYTHOS" | "FAKT" | "GIFTIG" } // a stamp
  | { type: "jar"; label?: string; sub?: string } // a product packshot (brand mark + label band), built out of the dot
  // Motion library. Numbers must be real (label / script), never invented.
  | { type: "bars"; items: readonly { label: string; value: number; unit?: string }[] } // 2–4 bars that grow + count up
  | { type: "focus"; rows: readonly { label: string; value: string }[] } // 2–3 rows on a glass card, a highlight walks down
  | { type: "flow"; from: readonly string[]; to: string } // 2–3 nodes whose paths flow into one
  | { type: "tabs"; tabs: readonly { title: string; text: string }[] } // 2–3 tabs, panels slide as the tab switches
  | { type: "ruler"; min: number; max: number; mark: readonly [number, number]; label: string; unit: string }; // a scale with a highlighted range

export interface Beat {
  shot: Shot;
  frames: number; // minimum length; a longer VO line stretches the beat
  title: readonly [string, string]; // line 1 light, line 2 gold
  note?: string; // typewriter caption in the safe zone
  rows?: readonly Row[]; // optional panel (max 3 rows), the dot marks each row
  block?: Block;
}

export interface Cta {
  shot: Shot;
  frames: number;
  button: string; // e.g. "LINK IN BIO"
  sub?: string; // under the wordmark, e.g. a product line
  note?: string; // under the button
}

export interface FootageSpec {
  id: string; // Remotion composition id, e.g. "Okt26-V01"
  beats: readonly Beat[]; // beats[0] is the hook
  cta: Cta;
  vo?: { src: string; lines: readonly VoLine[] }; // one line per beat + one for the CTA, in order
  music?: string; // music bed under the VO, relative to public/ — licensed tracks only
  captions?: readonly CaptionLine[]; // per VO line: spoken text + what's on screen -> word-popping captions
}

export const MIN_BEAT = 60;
export const ROWS_MIN = 120; // three row hops + the counters settling
export const HOOK_MIN = 100; // the dot's drop + three hops end at frame 94
export const CTA_MIN = 96; // button morph + note
export const VO_LEAD = 6; // a VO line starts this many frames into its chapter
export const VO_TAIL = 18; // breathing room after a VO line before the next cut

export interface Timing {
  starts: number[]; // chapter i starts here (last = CTA)
  lengths: number[];
  duration: number;
}

// Chapter lengths: the designed minimum, stretched to fit the VO line when a VO is present.
export function timing(spec: FootageSpec): Timing {
  const designed = [...spec.beats.map((b) => b.frames), spec.cta.frames];
  const lines = spec.vo?.lines ?? [];
  const lengths = designed.map((d, i) => {
    const line = lines[i];
    return line ? Math.max(d, VO_LEAD + (line.to - line.from) + VO_TAIL) : d;
  });
  const starts: number[] = [];
  let t = 0;
  for (const len of lengths) {
    starts.push(t);
    t += len;
  }
  return { starts, lengths, duration: t };
}

// VO lines re-anchored to the chapters: line i starts VO_LEAD frames into chapter i.
export function placeVo(spec: FootageSpec, tm: Timing): VoLine[] {
  return (spec.vo?.lines ?? []).map((l, i) => ({ from: l.from, to: l.to, at: (tm.starts[i] ?? 0) + VO_LEAD }));
}

// Fail at load time, not mid-render.
export function validate(spec: FootageSpec): FootageSpec {
  const err = (m: string): never => {
    throw new Error(`FootageSpec "${spec.id}": ${m}`);
  };
  if (!/^[A-Za-z0-9-]+$/.test(spec.id)) err("id may only contain letters, digits and '-'");
  if (spec.beats.length < 2 || spec.beats.length > 6) err("needs 2–6 beats (hook + 1–5)");
  spec.beats.forEach((b, i) => {
    const min = i === 0 ? HOOK_MIN : b.rows ? ROWS_MIN : MIN_BEAT;
    if (i === 0 && b.rows) err("the hook (beat 1) can't have rows");
    if (b.frames < min) err(`beat ${i + 1} is ${b.frames} frames, minimum ${min}`);
    if (b.rows && (b.rows.length < 1 || b.rows.length > 3)) err(`beat ${i + 1} rows must be 1–3`);
    if (b.title.some((l) => l.trim() === "")) err(`beat ${i + 1} has an empty title line`);
    const blk = b.block;
    if (blk?.type === "list" && (blk.items.length < 2 || blk.items.length > 5)) err(`beat ${i + 1} list needs 2–5 items`);
    if (blk?.type === "bars" && (blk.items.length < 2 || blk.items.length > 4 || blk.items.some((x) => !(x.value > 0)))) err(`beat ${i + 1} bars need 2–4 positive values`);
    if (blk?.type === "focus" && (blk.rows.length < 2 || blk.rows.length > 3)) err(`beat ${i + 1} focus needs 2–3 rows`);
    if (blk?.type === "flow" && (blk.from.length < 2 || blk.from.length > 3)) err(`beat ${i + 1} flow needs 2–3 sources`);
    if (blk?.type === "tabs" && (blk.tabs.length < 2 || blk.tabs.length > 3)) err(`beat ${i + 1} tabs needs 2–3 tabs`);
    if (blk?.type === "ruler" && !(blk.min <= blk.mark[0] && blk.mark[0] <= blk.mark[1] && blk.mark[1] <= blk.max && blk.max - blk.min <= 20))
      err(`beat ${i + 1} ruler needs min ≤ mark ≤ max and a span of ≤ 20`);
    if (blk && blk.type !== "none" && blk.type !== "jar" && b.rows) err(`beat ${i + 1}: rows only combine with a jar block`);
    if (i === 0 && blk && blk.type !== "none") err("the hook (beat 1) keeps the frame clear for the cover — no block");
  });
  if (spec.cta.frames < CTA_MIN) err(`cta is ${spec.cta.frames} frames, minimum ${CTA_MIN}`);
  const n = spec.beats.length + 1;
  if (spec.vo && spec.vo.lines.length !== n) err(`vo needs ${n} lines (one per beat + CTA), got ${spec.vo.lines.length}`);
  if (spec.captions && spec.captions.length !== n) err(`captions need ${n} texts (one per VO line), got ${spec.captions.length}`);
  if (timing(spec).duration > 60 * FPS) err("longer than 60 s");
  return spec;
}
