// Shots may name a library asset by id (assets/manifest.json) instead of a
// public/ path. Resolving checks that the asset exists, has the right kind,
// and — for clips — is long enough for its beat at the given trim and rate.

import manifest from "../../assets/manifest.json";
import { FPS } from "../kit/theme";
import type { Shot } from "./spec";

interface Asset {
  id: string;
  file: string;
  kind: string;
  source: string;
  duration: number;
  ai: boolean;
}

const ASSETS: ReadonlyMap<string, Asset> = new Map((manifest.assets as Asset[]).map((a) => [a.id, a]));

const isPath = (src: string) => src.includes("/");

// `frames` = how long the shot is on screen (its beat + the next iris).
export function resolveShot(shot: Shot, frames: number, where: string): Shot {
  if (shot.kind === "stage" || isPath(shot.src)) return shot; // no footage, or a raw public/ path — not checked
  const a = ASSETS.get(shot.src);
  if (!a) throw new Error(`${where}: unknown asset "${shot.src}" (see assets/manifest.json)`);
  if (a.kind !== shot.kind) throw new Error(`${where}: asset "${a.id}" is a ${a.kind}, the shot says ${shot.kind}`);
  if (shot.kind === "video") {
    const needed = (shot.trim ?? 0) + frames * (shot.rate ?? 1);
    const has = Math.floor(a.duration * FPS);
    if (needed > has) throw new Error(`${where}: "${a.id}" has ${has} frames, the shot needs ${Math.ceil(needed)} (trim + frames × rate)`);
  }
  return { ...shot, src: a.file };
}

// True when any shot uses AI footage — the post then needs TikTok's AI label.
export function usesAi(shots: readonly Shot[]): boolean {
  return shots.some((s) => s.kind !== "stage" && (ASSETS.get(s.src)?.ai ?? s.src.startsWith("footage/")));
}
