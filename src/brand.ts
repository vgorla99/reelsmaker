// ─────────────────────────────────────────────────────────────
//  RESKIN HERE. This is the only file you need to edit to make
//  ReelsMaker yours. Colors are checked for contrast at load time
//  (src/kit/theme.ts) — if a combination is illegible, Studio and
//  renders fail with a message telling you which pair to fix.
// ─────────────────────────────────────────────────────────────

export interface Brand {
  name: string; // bottom-right on every frame
  handle: string; // bottom-left on every frame + CTA button
  mark: { prefix: string; suffix: string }; // top-left wordmark; suffix is accented
  colors: {
    dark: string; // deep stage + ink on light stages          (very dark)
    light: string; // light stage + type on dark stages        (very light)
    primary: string; // the protagonist, highlights, CTA button (bright, glows on dark)
    secondary: string; // wipes, "after"/progress data          (mid-tone)
    tertiary: string; // stat / CTA stage                        (deep, saturated)
  };
  music: string | null; // e.g. "audio/bed.mp3" under public/ — only tracks you're licensed for
}

export const BRAND: Brand = {
  name: "REELSMAKER DEMO",
  handle: "@yourhandle",
  mark: { prefix: "REELS", suffix: "MAKER" },
  colors: {
    dark: "#0D0D12",
    light: "#F4F1EA",
    primary: "#FF5A36",
    secondary: "#0E8A82",
    tertiary: "#2B1E5C",
  },
  music: null,
};
