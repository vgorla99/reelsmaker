// A month's plan.json -> Remotion reels. Every planned video becomes a
// FootageSpec: Line 1 beats use their picked library asset, Line 2 beats get
// a brand stage + their block. A footage video registers only once all its
// clips are picked (shot.asset set); until then it is listed in `pending`.

import manifest from "../../assets/manifest.json";
import { footageReel } from "../footage/FootageReel";
import type { Beat, Block, Cta, FootageSpec, Row, Shot } from "../footage/spec";
import type { VoLine } from "../kit/audio";
import type { ReelEntry } from "../kit/reel";

export interface PlanBeat {
  title?: readonly string[];
  vo: string;
  caption?: string; // optional hand-written caption ("" = none); default = the VO minus what the headline says
  note?: string;
  rows?: readonly Row[];
  shot?: { pexels?: string; asset?: string; trim?: number; rate?: number; zoom?: "in" | "out"; pan?: "left" | "right" | "up" | "down" | "none" };
  block?: Block;
}

export interface PlanVideo {
  id: string;
  slug: string;
  line: "footage" | "motion";
  hook: readonly string[];
  beats: readonly PlanBeat[];
  ctaVo: string;
  ctaShot?: { asset: string; trim?: number; rate?: number };
}

export interface PlanFile {
  month: string; // "2026-10"
  defaults: { cta: { button: string; sub: string; note: string } };
  videos: readonly PlanVideo[];
}

export type VoMap = Readonly<Record<string, { src: string; lines: readonly { from: number; to: number }[]; music?: string }>>;

const KIND = new Map((manifest.assets as { id: string; kind: string }[]).map((a) => [a.id, a.kind]));
const STAGES = ["dark", "navy", "teal", "navy", "dark"] as const;
const FRAMES = { hook: 100, beat: 90, rows: 130, cta: 100 } as const;

const pair = (t: readonly string[] | undefined, where: string): readonly [string, string] => {
  if (!t || t.length !== 2) throw new Error(`${where}: title needs exactly 2 lines`);
  return [t[0], t[1]];
};

// A headline as one string; a word broken over the two lines ("HUNDE-" / "JAHRE") is rejoined.
const headText = (t: readonly string[]) => t.join("\n").replace(/-\n/g, "").replace(/\n/g, " ");

// "2026-10" + "V01" -> "2610-V01" (a valid, month-unique composition id)
export const reelId = (month: string, id: string) => `${month.slice(2, 4)}${month.slice(5, 7)}-${id}`;

function footageShot(s: PlanBeat["shot"]): Shot | null {
  if (!s?.asset) return null;
  const kind = KIND.get(s.asset);
  if (kind === "image") return { kind: "image", src: s.asset, zoom: s.zoom ?? "in", pan: s.pan ?? "none" };
  if (kind === "video") return { kind: "video", src: s.asset, trim: s.trim, rate: s.rate };
  throw new Error(`unknown asset "${s.asset}"`);
}

const BLOCK_TYPES = new Set(["none", "stat", "list", "compare", "verdict", "jar", "bars", "focus", "flow", "tabs", "ruler"]);

function toSpec(plan: PlanFile, v: PlanVideo, vo: VoMap): FootageSpec | null {
  const where = `${plan.month} ${v.id}`;
  if (v.line !== "footage" && v.line !== "motion") throw new Error(`${where}: line must be "footage" or "motion"`);
  const beats: Beat[] = [];
  for (const [i, b] of v.beats.entries()) {
    if (b.block && !BLOCK_TYPES.has(b.block.type)) throw new Error(`${where} beat ${i + 1}: unknown block "${b.block.type}"`);
    const shot = v.line === "motion" ? ({ kind: "stage", tone: STAGES[i % STAGES.length] } as const) : footageShot(b.shot);
    if (!shot) return null; // clip not picked yet
    beats.push({
      shot,
      frames: i === 0 ? FRAMES.hook : b.rows ? FRAMES.rows : FRAMES.beat,
      title: pair(i === 0 ? v.hook : b.title, `${where} beat ${i + 1}`),
      note: b.note,
      rows: b.rows,
      block: i === 0 ? undefined : b.block,
    });
  }
  // Footage videos need `ctaShot` (a real photo, not AI: scheduled posts can't carry TikTok's AI label via Publora).
  const ctaShot = v.line === "motion" ? ({ kind: "stage", tone: "dark" } as const) : footageShot(v.ctaShot);
  if (!ctaShot) return null; // CTA clip not picked yet
  const cta: Cta = { shot: ctaShot, frames: FRAMES.cta, button: plan.defaults.cta.button, sub: plan.defaults.cta.sub, note: plan.defaults.cta.note };
  const voEntry = vo[v.id];
  const lines: VoLine[] | undefined = voEntry?.lines.map((l) => ({ from: l.from, to: l.to, at: 0 })); // `at` is set per chapter
  return {
    id: reelId(plan.month, v.id),
    beats,
    cta,
    vo: voEntry && lines ? { src: voEntry.src, lines } : undefined,
    music: voEntry?.music,
    // Captions only once the VO exists. `caption` on a beat overrides the auto text (then nothing is skipped).
    captions: voEntry
      ? [
          ...v.beats.map((b, i) => (b.caption !== undefined ? { text: b.caption, head: "" } : { text: b.vo, head: headText(beats[i].title) })),
          { text: v.ctaVo, head: plan.defaults.cta.button },
        ]
      : undefined,
  };
}

export function reelsFromPlan(plan: PlanFile, vo: VoMap): { reels: ReelEntry[]; pending: string[] } {
  const reels: ReelEntry[] = [];
  const pending: string[] = [];
  for (const v of plan.videos) {
    const spec = toSpec(plan, v, vo);
    if (spec) reels.push(footageReel(spec));
    else pending.push(v.id);
  }
  return { reels, pending };
}
