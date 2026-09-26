// Shared, JSX-free types. Kept free of runtime imports so both the Remotion
// bundle (src/) and the Node CLI (scripts/reelsmaker.ts, run via Node's
// built-in type stripping) can import from here.

// extends Record<string, unknown>: required so these satisfy Remotion's
// <Composition> generic constraint (TS "Index signature for type 'string' is
// missing" otherwise — a strictness quirk, not a real type error).

export interface BrandConfig extends Record<string, unknown> {
  name: string; // shown bottom-right on every frame, e.g. "ACME STUDIO"
  handle: string; // shown bottom-left + in the CTA button, e.g. "@acme"
  shortMark: { prefix: string; suffix: string }; // top-left wordmark; suffix gets accents[0]
  colors: {
    bg: string; // page background
    ink: string; // headlines
    body: string; // body copy
    faint: string; // captions, particles, handle
    line: string; // chart tracks, dividers, progress-bar track
    card: string; // chart card fill
    accents: [string, string, string]; // rotation: 0 = hook/problem/morph bar, 1 = point A + stat, 2 = point B + CTA
  };
  fonts: {
    headline: string; // CSS font-family, must match a family in scripts/generate-fonts.mjs
    body: string; // CSS font-family, weights 500/600/700/800 are used
  };
}

export interface WordTiming {
  startFrame: number;
}

export type HookTypeVariant = "kinetic" | "buildup";
export type ProblemTypeVariant = "stagger" | "buildup";
export type PointAVariant = "radial" | "seesaw";
export type PointBVariant = "bar" | "orbit";
export type MorphPath = "classic" | "journey";

// The beat content of one reel. Field names match the original hardcoded-brand engine's
// props interface, so a props object ports between the two with no renames.
// Variant fields are optional and default to the "classic" look.
export interface ReelContent {
  kicker: string;
  hook: string; // use "\n" for manual line breaks
  hookTypeVariant?: HookTypeVariant; // default "kinetic"

  problemLine: string; // BEAT 2 — why it happens, 1-2 sentences
  problemTypeVariant?: ProblemTypeVariant; // default "stagger"

  pointATitle: string; // BEAT 3
  pointABody: string;
  pointAVariant?: PointAVariant; // default "radial"
  pointAStatLabel?: string; // radial
  pointAStatFrom?: number; // radial (reserved; ring always animates from 0)
  pointAStatTo?: number; // radial, 0-100
  pointALeftLabel?: string; // seesaw — the heavier (accent) side
  pointARightLabel?: string; // seesaw — the lighter cluster

  pointBTitle: string; // BEAT 4
  pointBBody: string;
  pointBVariant?: PointBVariant; // default "bar"
  pointBBeforeLabel?: string; // bar
  pointBBeforeValue?: number; // bar
  pointBAfterLabel?: string; // bar
  pointBAfterValue?: number; // bar
  pointBUnit?: string; // bar, e.g. "°", "kg", ""
  pointBStatLabel?: string; // orbit
  pointBStatTo?: number; // orbit, 0-100

  statLabel: string; // BEAT 5 — payoff stat, line chart
  statFrom: number;
  statTo: number;
  statSuffix: string;

  ctaText: string; // BEAT 6
  ctaSub: string;

  // Shared-element path for the MorphBar. "classic": underline -> vertical
  // rule held through the points. "journey": underline -> rule -> a 3-step
  // chapter marker that advances per point -> expands into the CTA button.
  morphPath?: MorphPath; // default "classic"

  // Optional audio, paths relative to public/. With hookTimings/bodyTimings
  // (word-level start frames) the text reveal syncs to a real voiceover.
  voiceoverSrc?: string;
  musicSrc?: string;
  musicVolume?: number; // 0-1, default 0.25
  hookTimings?: WordTiming[];
  bodyTimings?: WordTiming[]; // applies to problemLine
}

export interface ReelProps extends ReelContent, Record<string, unknown> {
  brand: BrandConfig;
}

// Props of the CLI-facing compositions ("ReelsMaker", "ReelsMakerContactSheet").
// The reel is nested under ONE key on purpose: Remotion shallow-merges
// --props over defaultProps, so with flat props any optional field a script
// omits (e.g. pointAVariant) would silently inherit the default script's
// value. Nesting makes --props replace the whole reel.
export interface ReelEntryProps extends Record<string, unknown> {
  reel: ReelProps;
}

// A ReelsMaker script file: beat content + a brand, either inline or by
// name (resolved from brands/<name>.json).
export interface ReelScript extends ReelContent {
  brand: string | BrandConfig;
}
