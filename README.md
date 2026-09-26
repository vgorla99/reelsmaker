# ReelsMaker

**Script in, Instagram Reel out.** ReelsMaker is a brand-agnostic [Remotion](https://www.remotion.dev) tool that turns a short JSON script (your words plus a brand file) into a finished 1080×1920 motion-graphics reel. The output has animated charts, wipe transitions and one persistent shared element that makes the reel read as a single continuous edit. Every render is spec-checked with ffprobe and comes with a contact sheet.

```bash
npm install
npm run reelsmaker -- --script=scripts/reelsmaker/lift-for-later.json
# -> out/lift-for-later.mp4  +  out/lift-for-later-contact-sheet.png
```

No timeline editing, no touching `Root.tsx`. Write a script, run one command, post.

---

## Output spec (hard requirement)

Every ReelsMaker render targets **Instagram Reels / Stories**:

| Property   | Value                                  | Enforced by                                           |
| ---------- | -------------------------------------- | ----------------------------------------------------- |
| Resolution | **1080 × 1920** (9:16)                 | `src/beats.ts` → every composition                    |
| Frame rate | **30 fps**                             | `src/beats.ts`                                        |
| Duration   | **≤ 60 s**. Default 40 s = 1200 frames | `src/beats.ts` throws at load if `BEATS` exceeds 60 s |
| Codec      | H.264 MP4                              | Remotion default                                      |

After each render the CLI runs `ffprobe` and **fails** unless the file is exactly 1080×1920, `30/1` and `REEL_DURATION` frames.

## Requirements

- Node **≥ 22.18** (the CLI is TypeScript run by Node's built-in type stripping, with no build step)
- Nothing else. Remotion downloads its own headless Chromium and ships its own ffmpeg/ffprobe.

---

## ReelsMaker, end to end

### 1. Reskin the brand (once)

Copy `brands/demo.json` to `brands/<yours>.json`:

```json
{
  "name": "ACME STUDIO",
  "handle": "@acme",
  "shortMark": { "prefix": "AC", "suffix": "ME" },
  "colors": {
    "bg": "#ffffff", "ink": "#111111", "body": "#555555", "faint": "#999999",
    "line": "#e5e5e5", "card": "#f7f7f7",
    "accents": ["#e4572e", "#17bebb", "#2e282a"]
  },
  "fonts": { "headline": "League Gothic", "body": "Inter" }
}
```

- `accents` is a rotation of exactly 3 colors. `[0]` is the hook/problem, MorphBar, progress bar and wordmark suffix; `[1]` is point A and the stat; `[2]` is point B and the CTA.
- Button text color is picked automatically (ink or white) from the accent's luminance.
- **Changing fonts:** `npm i @fontsource/<font>`, edit the `FONTS` list in `scripts/generate-fonts.mjs` so the family names match `fonts.headline` / `fonts.body`, then run `npm run fonts`. The body font needs weights 500/600/700/800.

### 2. Write a script

Copy `scripts/reelsmaker/lift-for-later.json` and edit the words. A script is **beat content plus a brand**. The brand is either a name (`"brand": "acme"` resolves to `brands/acme.json`) or an inline brand object.

```json
{
  "brand": "acme",
  "morphPath": "journey",
  "kicker": "HEALTH 101",
  "hook": "AFTER 40, MUSCLE\nIS YOUR PENSION.",
  "problemLine": "…why it happens, 1–2 sentences…",
  "pointATitle": "…", "pointABody": "…", "pointAVariant": "seesaw",
  "pointALeftLabel": "LIFTING", "pointARightLabel": "EXTRA STEPS",
  "pointBTitle": "…", "pointBBody": "…",
  "pointBBeforeLabel": "WEEK 0", "pointBBeforeValue": 11,
  "pointBAfterLabel": "WEEK 12", "pointBAfterValue": 15, "pointBUnit": " REPS",
  "statLabel": "…", "statFrom": 0, "statTo": 17, "statSuffix": "%",
  "ctaText": "LIFT FOR LATER.", "ctaSub": "…"
}
```

Every field, variant and copy-length guideline is listed in **[docs/script-reference.md](docs/script-reference.md)**.

### 3. Validate (optional, instant)

```bash
npm run reelsmaker -- --script=scripts/reelsmaker/my-reel.json --check
```

Errors name the exact field (for example `pointAStatTo: required when pointAVariant is "radial" (the default)`). Warnings flag copy that will wrap badly or finish revealing too late.

### 4. Render

```bash
npm run reelsmaker -- --script=scripts/reelsmaker/my-reel.json [--out=out/custom.mp4] [--no-sheet]
```

The command:
1. resolves the brand and validates the script
2. writes the resolved props to `out/.reelsmaker/<name>.props.json`
3. renders the `ReelsMaker` composition to `out/<name>.mp4`
4. **spec-checks** the file with ffprobe (resolution, fps, exact frame count) and exits non-zero on mismatch
5. renders `out/<name>-contact-sheet.png`

### 5. Verify

Open the contact sheet. It tiles 21 frames: for every beat boundary, the wipe **entering**, **fully covering** and **revealing**, plus each beat's **midpoint**. Every tile is the real `<Reel>` frozen at that frame. Check that:

- each boundary has a full-cover solid panel, with no seam and no hard cut;
- the MorphBar is visibly the same element across cuts;
- charts are mid-animation at their beat midpoints;
- no copy overflows the frame.

Then watch the MP4 once at full speed.

### Preview live (optional)

```bash
npm start                                                            # Studio, bundled examples
npx remotion studio src/index.ts --props=out/.reelsmaker/my-reel.props.json   # your script → open the "ReelsMaker" composition
```

---

## The vocabulary

The full reference, with props, timing and when to use each piece, is in **[docs/vocabulary.md](docs/vocabulary.md)**. In short:

| Layer              | Pieces                                                                                                                                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Beat engine**    | `BEATS` (6 beats: HOOK → PROBLEM → POINT A → POINT B → STAT/PROOF → CTA), `REEL_DURATION`, `beatOpacity` crossfade                                                                                                                         |
| **Continuity**     | `MorphBar` (shared-element/FLIP morph, `classic` or `journey` path), `StepTrack` (journey chapter marker), `WipeTransition` (cover-and-reveal panel at every boundary), `Particles` (deterministic ambient drift), `Backdrop`, `TopProgress`, `Wordmark` |
| **Charts / icons** | `GrowthLine`, `RadialProgress`, `BarCompare`, `OrbitRing`, `Seesaw`                                                                                                                                                                         |
| **Typography**     | `Words` (stagger-fade), `KineticWords` (scale-pop), `BuildUpWords` (accumulating reveal)                                                                                                                                                  |

Script variants choose among them: `hookTypeVariant`, `problemTypeVariant`, `pointAVariant` (radial | seesaw), `pointBVariant` (bar | orbit), `morphPath` (classic | journey).

## Bundled examples

| Script                                   | Shows                                                                   |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| `scripts/reelsmaker/lift-for-later.json` | `journey` MorphBar path, BuildUp hook, Seesaw, BarCompare, GrowthLine    |
| `scripts/reelsmaker/demo-classic.json`   | `classic` path, Kinetic hook, stagger body, RadialProgress, BarCompare |
| `scripts/reelsmaker/demo-contrast.json`  | `classic` path, BuildUp hook and body, Seesaw, OrbitRing               |

`npm run demo` renders the first one; `npm run demo:all` renders all three. Figures in the demo scripts are illustrative. **Fact-check any statistic before you publish a reel.**

## Project layout

```
brands/                     brand files (BrandConfig JSON)
scripts/reelsmaker/         reel scripts (ReelScript JSON), the examples live here
scripts/reelsmaker.ts       the ReelsMaker CLI
scripts/generate-fonts.mjs  embeds fonts -> src/fonts.generated.ts
src/beats.ts                BEATS timeline + Instagram spec constants
src/types.ts                BrandConfig / ReelProps / ReelScript
src/validate.ts             runtime validation (shared by CLI + Studio)
src/motion.tsx              the motion vocabulary (primitives)
src/Reel.tsx                the 6-beat composition
src/ContactSheet.tsx        the verification still
src/Root.tsx                composition registry
```

## Fonts

Fonts are **base64-embedded** as `@font-face` data URIs (`src/fonts.generated.ts`, mounted by `<GlobalFonts />`). They are not loaded through `@remotion/google-fonts` or `staticFile()` + `loadFont()`. Those approaches fetch at render time and depend on `delayRender()` resolving across every browser tab Remotion recycles, which reproducibly hung mid-render in sandboxed environments. Inline data URIs remove the fetch entirely. `src/fonts.generated.ts` **is checked in**, so render-only environments don't need the `@fontsource` packages. Regenerate it with `npm run fonts`. Bundled fonts (League Gothic, Inter) are SIL OFL.

## Audio

Scripts accept `musicSrc` / `voiceoverSrc` (paths relative to `public/`). No audio ships with this repo, and `public/audio/*` is gitignored. Only add tracks you hold a license for, and don't commit them to a public fork.

## License

Code: [MIT](LICENSE).

Remotion has its own license. It's free for individuals and companies of up to 3 people; larger companies need a [Remotion company license](https://www.remotion.dev/license). Using this template means you must comply with it.
