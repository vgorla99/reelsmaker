import React from "react";
import { Audio, interpolate, staticFile } from "remotion";

// Music bed with a short fade-in and a 40-frame fade-out, sized to the reel.
// `src` is relative to public/ (null = silent) — only use tracks you hold a license for.
export const MusicBed: React.FC<{ src: string | null; duration: number; volume?: number }> = ({ src, duration, volume = 0.24 }) =>
  src === null ? null : (
  <Audio
    src={staticFile(src)}
    volume={(fr) => interpolate(fr, [0, 20, duration - 40, duration], [0, volume, volume, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
  />
  );
