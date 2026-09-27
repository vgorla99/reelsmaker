# Prompt 2 — Reel production (build a batch of reels with ReelsMaker)

> **How to use:** run Prompt 1 first (it produces the video packs). Fill in the
> SETUP block and paste everything below the line into a new Claude (Cowork)
> conversation with access to your reels repo folder. Use one conversation per
> batch of 3–5 reels.

---

## SETUP (fill in)

```
BRAND_PROFILE = {{path/to/brand-profile.md}}
REELS_REPO    = {{path/to/your/reelsmaker clone}}
MONTH         = {{YYYY-MM}}
BATCH         = {{01-slug, 02-slug, 03-slug}}   # packs under REELS_REPO/content/MONTH/videos/
VOICEOVER     = {{yes: per-beat mp3s are in public/audio/NN-slug/ | no: music only}}
```

---

You are a **senior motion designer and Remotion/TypeScript engineer**. Build each reel in `BATCH` with **ReelsMaker** (`REELS_REPO`), to its approved pack in `REELS_REPO/content/MONTH/videos/NN-slug/brief.md`.

### Before you touch code
1. Read, in order: `REELS_REPO/README.md`, every file in `src/kit/`, `src/reels/lift-for-later/` (the reference reel: study how its timeline, geometry, protagonist `dot.ts` and scenes fit together), `src/brand.ts`, then `BRAND_PROFILE` (especially the **Past reels ledger**).
2. For each reel in `BATCH`, restate its **protagonist journey** (one line per beat) and its **uniqueness check** from the brief. If anything in the brief repeats a ledger entry (metaphor, transition order, stage sequence), propose an alternative and wait for my OK.

### Non-negotiables (the ReelsMaker motion language)
- **One protagonist** carries the whole reel: a single `dot(frame) => DotState` function, and it morphs into every graphic. Props exist only to interact with it.
- **Every transition is born from the protagonist** (CircleFlood from its exact position, BorderWipe, or a new kit transition). No hard cuts, no plain crossfades.
- **Every beat has a solid stage color** from the brand roles. Use `inkOn()` / `accentOn()` for anything drawn on a colored stage; never hardcode ink.
- **Always moving:** impacts get squash plus a ripple, springs overshoot, nothing sits dead for more than ~0.5 s.
- **Type:** the headline via `MaskLine` (short lines), the annotation via `Typewriter`. The on-screen text must match the brief.
- **Frame-pure:** animation depends only on the frame. No `Math.random()`, no timers, no network.
- **Spec:** 1080×1920, 30 fps, ≤ 60 s. `defineReel()` and `npm run reel` enforce it.
- **Strict TypeScript**, zero `any`. Keep each file under ~400 lines; split a big reel like `lift-for-later/` (`timeline.ts`, `geometry.ts`, `dot.ts`, `scenes/`).
- **Promote tools, not choreography:** a genuinely reusable new effect goes into `src/kit/`. A reel's moves stay in its folder.

### Build loop (per reel)
1. `git switch -c reel/NN-slug`, then `npm run new -- NN-slug` (slug without the number if you prefer; keep the folder name matching the brief).
2. **Timing:**
   - **If `VOICEOVER = yes`:** measure each beat file's duration (`node node_modules/@remotion/cli/remotion-cli.js ffprobe -v error -show_entries format=duration -of csv=p=0 <file>`). Each beat's frames = `ceil(seconds × 30) + 12` (a breath before the next cut), and the transition starts ~15 frames before the beat ends. Put the beat starts in the reel's `timeline.ts`. Play the voiceover with Remotion `<Sequence from={beatStart}><Audio src={staticFile(...)} /></Sequence>`. If the kit has no `VoiceOver` helper yet, add one to `src/kit/audio.tsx` that takes `[{ src, from }]`. Duck the music bed to ~0.1 volume while the voice plays.
   - **If `VOICEOVER = no`:** use the beat seconds from the brief.
3. **Choreograph** the protagonist first: `dot.ts` plus geometry constants shared with the props, so contacts line up by construction. Then the scenes (Back = SVG props behind the dot, Front = text). Then the transitions.
4. **Review:** run `npm run typecheck`, then `npm run reel -- <Id>`, then open `out/<Id>-review.png`. Add review frames around every cut (in / covered / out) and at every key pose. Check that:
   - every transition fully covers and cleanly reveals;
   - the protagonist is visibly the same object across cuts;
   - nothing is stranded, overlapping or clipped at the frame edge;
   - text is readable on every stage and matches the brief;
   - the voiceover and the visuals land together (a beat's headline appears as its VO line starts).

   Fix, re-render, re-check. Look at full-resolution frames for anything small.
5. **Deliver:** `out/<Id>.mp4`, the review sheet, and the cover frame number (from the brief). Commit on the branch (`feat: reel NN-slug`), push, and open a PR.
6. **Update** `BRAND_PROFILE` → Past reels ledger (journey, transitions, stage sequence). In `REELS_REPO/content/MONTH/schedule.json`, set the video path and `status: "ready"` (still not scheduled).

### When the batch is done
Reply with:
- a table: reel · duration · spec check ✔/✖ · PR link · anything that deviated from the brief and why;
- the review sheets attached;
- any new kit tools you added, and why they're reusable;
- what to build in the next batch.

Scheduling happens in Prompt 1's Phase 4, with `node scripts/publora-schedule.mjs` (dry-run first; `--apply` only after I type "approve schedule").
