# ReelsMaker vocabulary

Everything a reel is built from. All primitives live in `src/motion.tsx` and are composed in `src/Reel.tsx`. Every one is a **pure function of the current frame**: no `Math.random()`, no timers, no fetches. The same script always renders the same video.

Coordinates are in the 1080×1920 frame. Times are frames at 30 fps (30 frames = 1 s).

---

## 1. Beat engine (`src/beats.ts`)

A reel is six beats on a fixed timeline:

| Beat      | Frames   | Seconds | Accent       | Job                                                  |
| --------- | -------- | ------- | ------------ | ---------------------------------------------------- |
| `hook`    | 0–105    | 0–3.5   | `accents[0]` | Stop the scroll. Kicker plus a 2-line headline.      |
| `problem` | 105–270  | 3.5–9   | `accents[0]` | "WHY" plus 1–2 sentences.                            |
| `pointA`  | 270–480  | 9–16    | `accents[1]` | Title, body, chart card (radial or seesaw).          |
| `pointB`  | 480–690  | 16–23   | `accents[2]` | Title, body, chart card (bar or orbit).              |
| `stat`    | 690–930  | 23–31   | `accents[1]` | "THE RESULT": GrowthLine plus a counting stat.       |
| `cta`     | 930–1200 | 31–40   | `accents[2]` | Mark, CTA line, sub-line, "Follow @handle" button.   |

- `REEL_DURATION = BEATS.cta.end` (1200). `beats.ts` throws if it ever exceeds `MAX_REEL_SECONDS * REEL_FPS` (60 s).
- `beatOpacity(frame, start, end, isLast)` gives each scene a 20-frame (`XFADE`) fade in and out. The last beat holds to the end.
- **Changing timing:** edit `BEATS`. Keep beats contiguous. Everything downstream (wipes, MorphBar keyframes, contact-sheet frames, the CLI's ffprobe check) reads from it.

## 2. Continuity: what makes it one edit, not a slideshow

### `WipeTransition` (every beat boundary)
A full-frame solid panel in the incoming beat's accent. It sweeps in from one edge over `width` (15) frames, **fully covers the frame from `at-3` to `at+3`**, then exits the opposite edge and reveals the next beat, which is already rendered underneath. Directions alternate (`dir` 1 / −1). The beat swap happens entirely under the panel, so there is never a hard cut or a bare crossfade.

```tsx
<WipeTransition frame={frame} at={BEATS.pointA.start} color={accent1} dir={-1} />
```

### `MorphBar` (the shared element)
**One** absolutely positioned accent-colored element that persists for the whole reel. It reshapes between keyframes (FLIP-style) instead of each scene drawing its own. Each `BarKeyframe` is `{ beatStart, rect: { x, y, w, h, opacity, radius? }, dur? }`. At each beat start the bar eases (`easeInOutQuad`) from the previous rect over `dur` frames (default 22). `radius` lets it become a pill.

It is drawn **above** the scenes but **below** the wipes. It rides through each cut, disappears under the panel, and reappears already reshaped, which sells "same object, new scene".

Two paths ship, chosen per script with `morphPath`:

| `morphPath`         | Path                                                                                                                                                                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `classic` (default) | Underline under the kicker → vertical rule beside the copy, held through points and stat → fades out at the CTA.                                                                                                                                                            |
| `journey`           | Underline → vertical rule → **lifts into slot 01 of a 3-step chapter marker** under the wordmark → slides to **02** (point B) → **03** (stat) → **drops and expands into the CTA button** (the button background *is* the bar; the label is drawn on top by `CtaPillLabel`). |

Journey geometry (`STEP_SLOT`, `stepSlotRect(i)`, `CTA_PILL`) is shared by the keyframes and the scene layout. The bar therefore lands exactly on the slots and the button by construction, whatever the copy length.

### `StepTrack` (journey only)
Three faint slots plus `01 / 02 / 03` labels at `STEP_SLOT`. They are visible from point A until the CTA, and the active label takes `accents[0]`. The MorphBar sliding over them turns the shared element into a progress indicator.

### `Particles`
13 deterministic dots (seeded by index) drifting on sine/cosine paths and pulsing in opacity, so something is always moving. Every third dot takes `accents[0]`.

### `Backdrop`, `TopProgress`, `Wordmark`
- `Backdrop`: `colors.bg` plus two large blurred accent blobs drifting slowly.
- `TopProgress`: a 6 px bar across the top that fills over the whole reel.
- `Wordmark`: `shortMark` top-left (suffix in `accents[0]`), `handle` bottom-left, `name` bottom-right, on every frame.

These persist across every cut, which is a large part of the continuity.

## 3. Charts / icons

All five animate on after their card fades in (scene start + 65 frames; the stat chart at +35) and take an `accent` plus the `brand`.

| Component        | Reads as                                                                 | Used by            | Script fields                                                     |
| ---------------- | ------------------------------------------------------------------------ | ------------------ | ----------------------------------------------------------------- |
| `GrowthLine`     | "It goes up." Line draws on, dot rides the tip                           | stat beat (always) | `statFrom`, `statTo`, `statSuffix`, `statLabel`                   |
| `RadialProgress` | "X% of …". A ring fills and the center counts up                         | point A, `radial`  | `pointAStatTo` (0–100), `pointAStatLabel`                         |
| `BarCompare`     | Before vs after, two staggered bars with counting values                 | point B, `bar`     | `pointBBeforeLabel/Value`, `pointBAfterLabel/Value`, `pointBUnit` |
| `OrbitRing`      | "X out of a group". A ring of 20 dots, X% lit, slowly rotating           | point B, `orbit`   | `pointBStatTo` (0–100), `pointBStatLabel`                         |
| `Seesaw`         | "This outweighs that". One accent weight tips the beam against a cluster | point A, `seesaw`  | `pointALeftLabel` (heavy side), `pointARightLabel`                |

Guideline: pick the chart that fits the claim. Don't force a number where a comparison reads better (use Seesaw), or a bar where a share-of-a-group reads better (use OrbitRing).

## 4. Typography

| Component      | Motion                                                                                            | Default for                | Opt-in                                              |
| -------------- | ------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------- |
| `KineticWords` | Each word spring-pops in (scale 0.4→1), 6-frame stagger. Honors `\n`.                             | hook                       | `hookTypeVariant: "kinetic"`                        |
| `BuildUpWords` | Words accumulate. The newest word is accent-colored, then settles to 60%. Treats `\n` as a space. | none                       | `hookTypeVariant` / `problemTypeVariant: "buildup"` |
| `Words`        | Stagger-fade up, 3–4 frames per word. Calm, readable at speed. Honors `\n`.                        | problem line, point bodies | `problemTypeVariant: "stagger"`                     |

`KineticWords` (hook) and `Words` (problem) accept word-level `timings` (`hookTimings` / `bodyTimings`: `[{ startFrame }]`) to sync to a real voiceover instead of the fixed stagger.

**BuildUp budget:** at 7 frames per word, a `buildup` problem line needs about 20 words or fewer to finish inside its beat. At 14 frames per word, a `buildup` hook needs about 6 words or fewer.

## 5. Helpers

`fadeUp(frame, start, dur, dist)`, `popIn(frame, fps, start)`, `countUp(frame, start, dur, from, to)` (cubic ease-out), and `readableOn(hex, ink)` (WCAG-luminance text color for text on an accent).

## Adding a primitive

1. Add it to `src/motion.tsx`. Take colors and fonts from `brand` or `accent`, never literals, and animate only from `frame`.
2. Gate it behind a new optional variant field in `src/types.ts` and `src/validate.ts`, defaulting to the current look, so existing scripts render unchanged.
3. Use it in a scene in `src/Reel.tsx`, then check it on the contact sheet.
