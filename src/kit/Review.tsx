// Review sheet: one still that tiles a reel frozen at chosen frames, so a
// whole reel's transitions and key poses can be checked at a glance.
// Rendered with `npm run review -- <ReelId>`.

import React from "react";
import { AbsoluteFill, Freeze } from "remotion";
import { FONT, H, W } from "./theme";

export const REVIEW_COLS = 7;
const SCALE = 0.25;
const CW = W * SCALE;
const CH = H * SCALE;
const LABEL = 36;
const GAP = 12;
const PAD = 24;

export function reviewSize(count: number): { width: number; height: number } {
  const rows = Math.ceil(count / REVIEW_COLS);
  return {
    width: PAD * 2 + REVIEW_COLS * CW + (REVIEW_COLS - 1) * GAP,
    height: PAD * 2 + rows * (CH + LABEL) + (rows - 1) * GAP,
  };
}

export const ReviewSheet: React.FC<{ Reel: React.FC; frames: readonly number[]; fps: number }> = ({ Reel, frames, fps }) => (
  <AbsoluteFill style={{ background: "#161616", padding: PAD, display: "flex", flexDirection: "row", flexWrap: "wrap", gap: GAP, alignContent: "flex-start" }}>
    {frames.map((f) => (
      <div key={f} style={{ width: CW, height: CH + LABEL }}>
        <div style={{ width: CW, height: CH, overflow: "hidden", position: "relative" }}>
          <div style={{ width: W, height: H, transform: `scale(${SCALE})`, transformOrigin: "top left", position: "relative" }}>
            <Freeze frame={f}>
              <Reel />
            </Freeze>
          </div>
        </div>
        <div style={{ height: LABEL, display: "flex", alignItems: "center", fontFamily: FONT.mono, fontSize: 18, color: "#ccc" }}>
          f{f} · {(f / fps).toFixed(2)}s
        </div>
      </div>
    ))}
  </AbsoluteFill>
);
