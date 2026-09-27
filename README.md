# ReelsMaker

**Morphing motion-graphics Instagram Reels, built with [Remotion](https://www.remotion.dev).** One shape (the protagonist) carries the whole story and becomes every graphic, and every transition grows out of it. Output is 1080×1920 at 30 fps and ≤ 60 s, with every render spec-checked.

**Every reel is unique.** ReelsMaker is not a fill-in-the-blanks template. You get a **kit** (a shared motion language) and write a **new choreography for every reel**. Two reels share the look. They never share the moves.

```bash
npm install
npm run demo                        # renders the example reel -> out/LiftForLater.mp4 + review sheet
npm run new -- grip-strength        # scaffold your own reel: src/reels/grip-strength ("GripStrength")
npm start                           # Remotion Studio — scrub it live
npm run reel -- GripStrength        # render + Instagram spec check + review sheet
```

Requires Node ≥ 20. Remotion downloads its own headless Chromium and ships ffmpeg/ffprobe.

```
src/brand.ts        your name, handle, mark, 5 colors, optional music — the ONLY file to reskin
src/kit/            the motion language — shared by every reel
src/reels/<slug>/   one video: its timeline, its protagonist, its scenes
src/reels/_starter/ a tiny working reel that `npm run new` copies
prompts/            copy-paste AI prompts: channel audit → 15-reel monthly plan → VO → render → schedule
```

> **Want a whole month of reels?** [`prompts/`](prompts/) has copy-paste prompts for Claude that run the full loop for any brand: channel analysis, a monthly strategy with 15 scripted reels, ElevenLabs voiceover scripts, captions and hashtags, production with this kit, and automated scheduling via Publora. Approval gates sit at every step.

---

## 1. Make it yours: `src/brand.ts`

```ts
export const BRAND: Brand = {
  name: "ACME STUDIO",
  handle: "@acme",
  mark: { prefix: "AC", suffix: "ME" },        // top-left wordmark, suffix accented
  colors: {
    dark: "#0D0D12",       // deep stage + ink on light stages
    light: "#F4F1EA",      // light stage + type on dark stages
    primary: "#FF5A36",    // the protagonist, highlights, CTA button — bright, glows on dark
    secondary: "#0E8A82",  // wipes, "after"/progress data — mid-tone
    tertiary: "#2B1E5C",   // stat / CTA stage — deep, saturated
  },
  music: null,             // or "audio/bed.mp3" under public/ (licensed tracks only)
};
```

- Colors are **contrast-checked at load**. If a pair would be illegible (e.g. `primary` on `dark` below 4.5:1), Studio and renders stop with a message naming the pair to fix.
- Text on any stage picks dark or light ink by actual contrast (`inkOn()`), and small accents pick a visible accent (`accentOn()`), so a reskin never needs per-scene color edits.
- **Fonts** (Space Grotesk + JetBrains Mono by default) are base64-embedded, so there are no render-time font fetches. To change them, `npm i @fontsource/<font>`, edit `FONTS` in `scripts/generate-fonts.mjs` and `FONT` in `src/kit/theme.ts`, then run `npm run fonts`.

## 2. The motion language (what stays the same)

1. **One protagonist.** A reel defines ONE shape as a pure function `dot(frame) => DotState`. `<Protagonist>` renders it with velocity squash-and-stretch and glow. Circle, coin, pill and button are one rounded rect with different `w / h / rx`, so it morphs into all of them.
2. **Transitions are born from it.** No hard cuts, no plain crossfades.
   - `CircleFlood`: the protagonist swells until it *is* the next stage.
   - `BorderWipe`: a frame border closes in, then reopens on the next scene.
3. **Stages walk the palette.** Each chapter has a solid stage color, and the corner chrome (mark, chapter counter, handle) adapts its ink automatically.
4. **Two voices of type.**
   - `MaskLine` (display face, slides up out of a mask) says the point.
   - `Typewriter` (mono, typed with a block cursor) annotates the action.
5. **Always moving.** Impact ripples, overshooting springs, slow spins, pulses, film grain. There are no dead frames.

### Kit reference (`src/kit/`)

| Module           | Gives you                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `theme.ts`       | `W H FPS MAX_FRAMES`, palette `C` (from brand), `inkOn` / `accentOn` / `contrast`, `FONT`, `MARGIN`, `BRAND`           |
| `anim.ts`        | `prog`, `tween`, `ease.*`, `springIn` (optionally bouncy), `hop` (parabolic arc), `squash` (impact), `rot`, `mix`, `typed` |
| `protagonist.ts` | `DotState`, `DotFn`, `circle()`, `pill()`, `HIDDEN`                                                                    |
| `svg.tsx`        | `<Protagonist>`, `<Ripple>`, `<CircleFlood>`, `<BorderWipe>`, `<Grain>`                                                |
| `text.tsx`       | `<MaskLine>`, `<Typewriter>`, `<Fade>`, `<Chrome>`                                                                     |
| `audio.tsx`      | `<MusicBed>` (fade in/out; silent when `brand.music` is null)                                                          |
| `reel.ts`        | `defineReel()`: validates duration ≤ 60 s and review frames                                                            |
| `Review.tsx`     | the review sheet, auto-registered as `<Id>-Review` for every reel                                                      |

Everything animates from the frame number only (no `Math.random()`, no timers), so renders are deterministic.

## 3. Making a reel (keep it unique)

1. **Script.** Six beats or fewer: hook, problem, 1–3 points, proof/stat, CTA.
2. **Plan the protagonist's journey.** For each beat, ask: *what does the shape become, or do, that SHOWS this point?* Write one line per beat before any code. The example reel, `src/reels/lift-for-later`:

   | Beat       | The protagonist…                                                                 |
   | ---------- | -------------------------------------------------------------------------------- |
   | Hook       | drops, bounces, is tossed like a coin ("muscle is your pension")                 |
   | Problem    | floods the screen, reappears, gets bitten smaller each decade, fails a staircase |
   | Strength   | outweighs a crowd of "steps" dots on a seesaw                                    |
   | Chair test | does chair-stands, then flies into a capsule as the 15th rep                     |
   | Stat       | is the glowing core of an orbit; an arc lights 17% of the ring; a flower blooms  |
   | CTA        | the ring implodes into it, it flares into a sun, then squashes into the button   |

3. **Uniqueness check.** Before building, confirm:
   - [ ] No beat reuses a metaphor from an earlier reel.
   - [ ] The transition types and order differ from your last reel.
   - [ ] The stage-color sequence differs from your last reel.
   - [ ] At least one prop or behavior exists that no earlier reel had.
4. **Scaffold.** `npm run new -- <slug>`, then replace the starter's timeline, `dot()` and chapters. For bigger reels, split the folder the way `lift-for-later/` does (`timeline.ts`, `geometry.ts`, `dot.ts`, `scenes/`).
5. **Review.** `npm run reel -- <Id>`, then open `out/<Id>-review.png` (a tile of frozen frames around every cut) and check that:
   - every transition covers fully and reveals cleanly;
   - the protagonist is visibly the same object across cuts;
   - nothing is stranded or overlapping;
   - text is readable on every stage.

   Then watch the MP4 at full speed.
6. **Promote tools, not choreography.** If you invent a new transition or text effect worth reusing, move it into `src/kit/`.

## Instagram spec (hard requirement)

| Property   | Value                | Enforced by                                                        |
| ---------- | -------------------- | ------------------------------------------------------------------ |
| Resolution | 1080 × 1920 (9:16)   | every composition (`kit/theme.ts`), then ffprobe in `npm run reel` |
| Frame rate | 30 fps               | same                                                               |
| Duration   | ≤ 60 s (1800 frames) | `defineReel()` throws at load; ffprobe re-checks the file          |

## Notes

- **Facts:** every on-screen statistic needs a source, so put the citation on screen (the example's stat chapter does). The example's chair-stand numbers are illustrative.
- **Audio:** none ships with the repo (`public/audio/*` is gitignored). Only add tracks you hold a license for.
- **Troubleshooting:** on Windows a render can fail once with `remotion-audio-mixing\0.wav: No such file or directory`. That's a transient temp-folder race; run the command again.
- **v1** (JSON-script text-card reels) is preserved at tag [`v1.0.0`](../../tree/v1.0.0).

## License

Code: [MIT](LICENSE). Fonts: SIL Open Font License.

Remotion has its own license. It's free for individuals and companies of up to 3 people; larger companies need a [Remotion company license](https://www.remotion.dev/license).
