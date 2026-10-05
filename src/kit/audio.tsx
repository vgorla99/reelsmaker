import React from "react";
import { Audio, Sequence, interpolate, staticFile } from "remotion";

// A voiceover cut into lines: each line is the slice [from, to) of `src`
// (frames at 30 fps) and starts playing at reel frame `at`. One file from
// ElevenLabs is enough — cut it at the pauses between sentences.
export interface VoLine {
  from: number;
  to: number;
  at: number;
}

export const VoiceOver: React.FC<{ src: string; lines: readonly VoLine[]; volume?: number }> = ({ src, lines, volume = 1 }) => (
  <>
    {lines.map((l) => (
      <Sequence key={l.at} from={l.at} durationInFrames={l.to - l.from} layout="none">
        <Audio src={staticFile(src)} trimBefore={l.from} trimAfter={l.to} volume={volume} />
      </Sequence>
    ))}
  </>
);

// Music bed with a short fade-in and a 40-frame fade-out, sized to the reel.
// `src` is relative to public/ (null = silent) — only use tracks you hold a license for.
export const MusicBed: React.FC<{ src: string | null; duration: number; volume?: number }> = ({ src, duration, volume = 0.24 }) =>
  src === null ? null : (
  <Audio
    src={staticFile(src)}
    volume={(fr) => interpolate(fr, [0, 20, duration - 40, duration], [0, volume, volume, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
  />
  );
