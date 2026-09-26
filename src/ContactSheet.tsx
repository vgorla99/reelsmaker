// A single still that tiles the reel at every beat boundary (wipe entering /
// fully covering / revealing) plus each beat's midpoint. Rendered by the
// ReelsMaker CLI after every render, so the transitions + shared element
// can be eyeballed in one image. Each tile is the real <Reel> frozen at a
// frame via <Freeze> — same component, same props as the MP4.

import React from "react";
import { AbsoluteFill, Freeze } from "remotion";
import { BEATS, BEAT_BOUNDARIES, BEAT_ORDER, CONTACT_SHEET_FRAMES, REEL_HEIGHT, REEL_WIDTH } from "./beats";
import { Reel } from "./Reel";
import type { ReelEntryProps, ReelProps } from "./types";

export const SHEET_COLS = 7;
const SCALE = 0.25;
const CELL_W = REEL_WIDTH * SCALE; // 270
const CELL_H = REEL_HEIGHT * SCALE; // 480
const LABEL_H = 40;
const GAP = 12;
const PAD = 24;

const rows = Math.ceil(CONTACT_SHEET_FRAMES.length / SHEET_COLS);
export const SHEET_WIDTH = PAD * 2 + SHEET_COLS * CELL_W + (SHEET_COLS - 1) * GAP;
export const SHEET_HEIGHT = PAD * 2 + rows * (CELL_H + LABEL_H) + (rows - 1) * GAP;

function describe(frame: number): string {
  for (const b of BEAT_BOUNDARIES) {
    if (frame === b) return "wipe covers";
    if (frame < b && frame >= b - 10) return "wipe in";
    if (frame > b && frame <= b + 10) return "wipe out";
  }
  const beat = BEAT_ORDER.find((name) => frame >= BEATS[name].start && frame < BEATS[name].end);
  return beat ? `${beat} mid` : "";
}

export const ContactSheet: React.FC<ReelEntryProps> = ({ reel }) => {
  // Audio is irrelevant for a still; drop it so tiles don't mount 21 players.
  const silent: ReelProps = { ...reel, musicSrc: undefined, voiceoverSrc: undefined };
  return (
    <AbsoluteFill
      style={{ background: "#111", padding: PAD, display: "flex", flexDirection: "row", flexWrap: "wrap", gap: GAP, alignContent: "flex-start" }}
    >
      {CONTACT_SHEET_FRAMES.map((f) => (
        <div key={f} style={{ width: CELL_W, height: CELL_H + LABEL_H }}>
          <div style={{ width: CELL_W, height: CELL_H, overflow: "hidden", position: "relative", outline: "1px solid #333" }}>
            <div style={{ width: REEL_WIDTH, height: REEL_HEIGHT, transform: `scale(${SCALE})`, transformOrigin: "top left", position: "relative" }}>
              <Freeze frame={f}>
                <Reel {...silent} />
              </Freeze>
            </div>
          </div>
          <div style={{ height: LABEL_H, display: "flex", alignItems: "center", fontFamily: "monospace", fontSize: 18, color: "#ddd" }}>
            f{f} · {describe(f)}
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
