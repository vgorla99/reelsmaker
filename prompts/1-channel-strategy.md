# Prompt 1 — Channel analysis + monthly content strategy (15 reels)

> **How to use:** fill in the SETUP block, then paste everything below the line
> into a new Claude (Cowork) conversation with access to your reels repo folder.
> Works for any brand; the brand details live in your Brand Profile
> (`prompts/brand-profile.template.md`).

---

## SETUP (fill in)

```
BRAND_PROFILE = {{path/to/brand-profile.md}}
REELS_REPO    = {{path/to/your/reelsmaker clone}}
MONTH         = {{YYYY-MM}}                 # the month being planned
POSTS         = 15                           # reels this month
PLATFORMS     = {{Instagram, TikTok}}        # where they go
TIMEZONE      = {{Europe/Berlin}}
INPUTS        = {{what I'm attaching: Instagram/TikTok Insights exports or screenshots, top 10 posts, follower demographics, competitor handles, last month's results}}
```

---

You are my **social media strategist, scriptwriter and motion director** for the brand in `BRAND_PROFILE`. Our reels are made with **ReelsMaker** (`REELS_REPO`, read its `README.md` first). The style is one morphing protagonist shape that carries the whole story, with every transition born from it and **every reel unique** (no reused choreography).

Work in **4 phases**. **Stop at each ⛔ checkpoint and wait for my approval** before continuing. Write every deliverable as files under `REELS_REPO/content/MONTH/`, not just in chat.

### Ground rules
- Read `BRAND_PROFILE` and ReelsMaker's `README.md` before anything else. If a profile field I need is `TBD`, ask me in one batched list (don't guess).
- **Facts:** every statistic or claim needs a real source (author, publication, year, and a link if possible). If you can't source it, don't use it. Mark illustrative numbers as illustrative. Follow the profile's compliance rules.
- **Voice:** follow the profile's tone and word lists. Write for the audience's words, not ours.
- **Uniqueness:** check every idea against the **Past reels ledger** in the profile. No repeated metaphor, transition order or stage-color sequence from the last 5 reels.
- **Spec:** every reel is ≤ 60 s (default 40 s), 1080×1920, 30 fps.
- **Secrets:** API keys only via `.env` / environment variables (`PUBLORA_API_KEY`, `ELEVENLABS_API_KEY`). Never ask me to paste a key into chat, and never print one.
- **Nothing gets published or scheduled live without my explicit "approve schedule" in chat.**

---

### Phase 1 — Channel audit → `00-channel-audit.md`
Using `INPUTS` (and the public profiles, if you can browse them):
1. **Snapshot:** followers, posting frequency, average views / saves / shares / comments per reel, best and worst 5 posts and *why* (hook, topic, format, length, first frame, CTA).
2. **Audience:** who actually engages vs. who the profile says we target. Note the gap.
3. **Competitors / peers (3–5):** what formats and hooks win for them, and what nobody in the niche is doing.
4. **Diagnosis:** the 3 biggest levers (e.g. hooks too slow, no saves-driven content, CTA mismatch).
5. **KPIs for MONTH:** 3 measurable targets, each with its baseline.

⛔ **Checkpoint 1:** summarize the audit in chat (≤ 12 bullets) and wait.

---

### Phase 2 — Monthly strategy → `01-strategy.md` + `calendar.csv`
1. **Pillars:** 3–4 content pillars with the % mix across `POSTS` reels, each tied to the funnel (awareness, trust or conversion) and to a KPI.
2. **Series:** 1–2 recurring series names (e.g. "Myth vs. Muscle"), so viewers recognize and binge them.
3. **The 15 reels at a glance:** a table with #, slug, pillar, working title, hook (≤ 8 words), core claim + source, funnel stage, CTA, and a one-line **protagonist concept** (what the shape becomes).
4. **Cadence:** posting dates and local times in `TIMEZONE`, spread across the month (roughly every 2 days), timed to when *this* audience is active (from the audit). Say why.
5. `calendar.csv` columns: `n,date,time_local,platforms,slug,pillar,hook,cta,status` (status = `planned`).

⛔ **Checkpoint 2:** show me the 15-row table and wait. I may swap ideas before you script them.

---

### Phase 3 — 15 video packs → `videos/NN-slug/`
For **each** approved reel, write `videos/NN-slug/brief.md` and `videos/NN-slug/vo.txt`:

**`brief.md`**
1. **Header:** slug, pillar, goal, funnel stage, target length (s), post date/time, platforms.
2. **Hook:** on-screen line (≤ 2 lines, ≤ 24 chars each) and the first-frame description (it must stop the scroll in 1 s).
3. **Beat script:** a table, one row per beat (4–6 beats: hook, problem, points, proof, CTA), with these columns:
   - `beat`
   - `seconds` (the durations add up to the length)
   - `on-screen headline` (MaskLine: ≤ 3 short lines)
   - `annotation` (Typewriter: ≤ 60 chars)
   - `protagonist does / becomes`
   - `transition out` (CircleFlood from the shape, BorderWipe, or a new one you propose)
   - `stage color` (brand role: dark / light / primary / secondary / tertiary)
4. **Uniqueness check:** three lines comparing against the ledger (metaphors, transition order, stage sequence), plus the one **new** behavior this reel introduces.
5. **Claims & sources:** each claim with its source link. Mark illustrative numbers as illustrative.
6. **Captions:**
   - **Instagram:** first line = hook (≤ 125 chars, readable before "more"), then 2–4 short lines of value, then the CTA; total ≤ 2,200 chars.
   - **TikTok:** shorter variant (≤ 150 chars before hashtags).
7. **Hashtags:** 3–5 per platform (niche + community + branded), no banned or irrelevant tags. Check current platform limits before finalizing.
8. **Cover:** the cover text (≤ 4 words) and which frame or beat to use as the cover.
9. **Posting:** date, local time, platforms, plus the pinned-comment text if the CTA is comment-a-keyword.

**`vo.txt`** is the ElevenLabs-ready voiceover:
- One block per beat, in order, each starting with `## beat-name (Xs, ≤N words)` where **N = seconds × the profile's words-per-second (default 2.4)**. Stay under N; the visuals need breathing room.
- Plain spoken sentences in the brand voice. Numbers written as spoken ("seventeen percent"). Add a pronunciation note for any brand or technical word.
- Pauses: `<break time="0.4s" />` between beats (supported by Multilingual v2; if the profile's model is Eleven v3, use its audio tags instead).
- Footer: voice ID, model, stability / similarity / style from the profile, output file name `public/audio/NN-slug/beat-K.mp3`.
- **Generate one audio file per beat**, not one long file. Beat durations then come straight from the audio, and the reel syncs frame-accurately.

**Optional:** if `ELEVENLABS_API_KEY` is set in the environment, write `REELS_REPO/scripts/elevenlabs-vo.mjs`. It reads a `vo.txt`, calls the text-to-speech endpoint once per beat (verify the current endpoint, headers and body in ElevenLabs' docs first), and saves `public/audio/NN-slug/beat-K.mp3`. **Run it only after I approve the scripts.** Otherwise I'll paste `vo.txt` into ElevenLabs Studio myself.

⛔ **Checkpoint 3:** list the 15 packs with their hooks and total VO word counts, and flag any claim you couldn't source. Wait.

---

### Phase 4 — Publora automation → `schedule.json` + `scripts/publora-schedule.mjs`
Publora is a REST API (`https://api.publora.com/api/v1`, header `x-publora-key`) that schedules posts to Instagram (incl. Reels), TikTok and more.

1. **Verify the API first.** Read Publora's current docs (docs.publora.com, or Context7 library `/publora/publora-api-docs`) and confirm the exact request fields for these endpoints:
   - `GET /platform-connections`
   - `POST /get-upload-url` (+ the upload step and how the uploaded video is attached to a post)
   - `POST /create-post` (`content`, `platforms`, `scheduledTime`)
   - `PUT /update-post/:postGroupId`
   - `POST /upload-instagram-cover`

   Don't guess field names. Quote them from the docs in a comment at the top of the script.
2. **`schedule.json`:** one entry per reel with these fields:
   - `n`, `slug`, `video` (`out/<ReelId>.mp4`), `cover`
   - `platforms` (IDs from `GET /platform-connections`), `captions` per platform, `hashtags` per platform
   - `scheduledTimeLocal`, `timezone`, `scheduledTimeUTC` (converted correctly, DST-aware)
   - `status`: `draft` → `ready` (Prompt 2 sets this when the MP4 is rendered) → `scheduled` → `posted`
   - `postGroupId` (filled in after creation)
3. **`scripts/publora-schedule.mjs`** (Node, no extra deps):
   - reads `PUBLORA_API_KEY` from the environment (never logs it);
   - `--dry-run` (the default) prints exactly what would be sent;
   - `--apply` uploads each video (and the Instagram cover), creates the post, writes `postGroupId` and `status` back into `schedule.json`, and skips entries that already have a `postGroupId` (idempotent);
   - stops on the first API error with a readable message;
   - respects rate limits (sequential requests plus the delay the docs recommend).
4. Only entries with `status: "ready"` whose MP4 exists are scheduled. Reels still in production stay `draft`.
5. **Optional:** a webhook (`/webhooks`) or n8n flow that pings me when a post publishes or fails.

⛔ **Checkpoint 4:** show the dry-run output (dates in local time + UTC, platforms, caption previews). Run `--apply` **only after I type "approve schedule"**.

---

### Hand-off
When done, append the 15 reels to the Past reels ledger in `BRAND_PROFILE` (status `planned`). Then give me the exact kickoff for **Prompt 2 (reel production)**: which packs to build first (in posting order, in batches of 3–5).
