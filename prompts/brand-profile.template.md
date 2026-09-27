# Brand Profile — {{BRAND_NAME}}

> Fill this in **once per brand** and keep it next to your reels repo.
> Both prompts (`1-channel-strategy.md`, `2-reel-production.md`) read it.
> Anything you don't know yet, write `TBD`; the strategy prompt will ask.
> **Never put API keys in this file.** Keys live in `.env` (gitignored).

## 1. Identity
- **Brand name:**
- **Handles:** Instagram `@` · TikTok `@` · YouTube Shorts `@` · other:
- **Website / link in bio:**
- **Market(s) & location:** (e.g. city/country, online/in-person)
- **Content language(s):** (e.g. EN, or EN + DE subtitles)
- **One-line positioning:** "We help {{WHO}} {{ACHIEVE WHAT}} without {{PAIN}}."

## 2. Audience
- **Primary audience:** age, life situation, what they want, what's in the way
- **Secondary audience:**
- **What they already believe / common objections:**
- **Words they use to describe the problem:** (their language, not ours)

## 3. Offer & funnel
- **Offers:** name, price point, format
- **Primary CTA for reels:** follow / comment a keyword / DM / link in bio / lead form
- **Lead capture:** (e.g. form URL, n8n webhook, DM automation)
- **KPIs that matter this quarter:** (e.g. followers, saves, shares, DMs, leads)

## 4. Voice
- **Tone (3 adjectives):**
- **Never sounds like:**
- **Words / phrases we use:**
- **Words / phrases we avoid:**

## 5. Visual system (ReelsMaker)
- **Reels repo path:** (local folder of your ReelsMaker clone)
- **Palette** (`src/brand.ts` roles, hex):
  - dark:
  - light:
  - primary: (the protagonist; must glow on dark)
  - secondary:
  - tertiary:
- **Fonts:** (default Space Grotesk + JetBrains Mono)
- **Music bed:** `public/audio/…` (licensed only) or `none`

## 6. Content pillars (draft; the strategy prompt refines these)
1.
2.
3.
4.

## 7. Compliance
- **Claims rules:** (e.g. health/finance: no promises, cite a source for every statistic, "not medical advice" where relevant)
- **Privacy / GDPR / consent notes:** (client stories, faces, testimonials)
- **Topics we never touch:**

## 8. Tools
- **ElevenLabs:** voice name + voice ID, model (e.g. `eleven_multilingual_v2`), language, default stability / similarity / style, speaking pace (words per second, default 2.4)
- **Publora:** platforms connected (IDs come from `GET /platform-connections`), timezone (e.g. `Europe/Berlin`), preferred posting windows
- **Secrets:** `ELEVENLABS_API_KEY`, `PUBLORA_API_KEY` in `.env` (never committed, never pasted into chat)

## 9. Past reels ledger (keeps every reel unique)
| slug | posted | protagonist journey (one line per beat) | transitions in order | stage color sequence | result (views / saves / shares) |
| ---- | ------ | ---------------------------------------- | -------------------- | -------------------- | ------------------------------- |
|      |        |                                          |                      |                      |                                 |
