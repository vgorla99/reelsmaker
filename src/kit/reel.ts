import type React from "react";
import { MAX_FRAMES } from "./theme";

// What every reel folder exports from its Reel.tsx as `reel`.
export interface ReelEntry {
  id: string; // Remotion composition id, PascalCase, e.g. "LiftForLater"
  component: React.FC;
  durationInFrames: number; // <= MAX_FRAMES (60s)
  reviewFrames: readonly number[]; // frames tiled by `npm run review`
}

export function defineReel(entry: ReelEntry): ReelEntry {
  if (entry.durationInFrames > MAX_FRAMES) {
    throw new Error(`Reel "${entry.id}" is ${entry.durationInFrames} frames — over the ${MAX_FRAMES}-frame (60s) Instagram ceiling`);
  }
  const bad = entry.reviewFrames.filter((f) => f < 0 || f >= entry.durationInFrames);
  if (bad.length) throw new Error(`Reel "${entry.id}" has review frames outside its duration: ${bad.join(", ")}`);
  return entry;
}
