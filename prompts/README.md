# ReelsMaker prompt kit

Copy-paste prompts that take a brand from **channel analysis → monthly plan → 15 scripted reels → voiceover → rendered videos → scheduled posts**. Written for Claude (Cowork, or Claude Code) with access to your ReelsMaker folder. They work for any brand.

| File | Use it for |
| --- | --- |
| [`brand-profile.template.md`](brand-profile.template.md) | Fill in **once per brand**: audience, voice, palette, ElevenLabs voice, Publora accounts, compliance, and a ledger of past reels (it keeps every reel unique). |
| [`1-channel-strategy.md`](1-channel-strategy.md) | **Monthly.** Channel audit, then strategy + calendar, then 15 video packs (idea, beat script, protagonist storyboard, ElevenLabs VO script, captions, hashtags, cover), then the Publora schedule (dry-run first). |
| [`2-reel-production.md`](2-reel-production.md) | **Per batch of 3–5 reels.** Builds the reels from the packs with the ReelsMaker kit, synced to per-beat voiceover, review-sheet checked, one PR per reel. |

## The monthly loop

```
brand-profile.md ──► Prompt 1 ──► content/YYYY-MM/
                        │           ├─ 00-channel-audit.md
                        │           ├─ 01-strategy.md + calendar.csv
                        │           ├─ videos/NN-slug/{brief.md, vo.txt}   ×15
                        │           └─ schedule.json   (Publora manifest)
                        ▼
      ElevenLabs: one mp3 per beat → public/audio/NN-slug/beat-K.mp3
                        ▼
                     Prompt 2 (×3–4 batches) ──► out/<Id>.mp4 + review sheets
                        ▼
      node scripts/publora-schedule.mjs            # dry-run
      node scripts/publora-schedule.mjs --apply    # only after "approve schedule"
```

## Safety rails built into the prompts
- **Approval gates:** each phase stops at a ⛔ checkpoint. Nothing is scheduled without you typing **"approve schedule"**.
- **Keys** stay in `.env` (`ELEVENLABS_API_KEY`, `PUBLORA_API_KEY`). They're never pasted into chat, printed or committed.
- **Facts:** every on-screen statistic needs a source. Illustrative numbers are labeled as such.
- **APIs are verified, not guessed:** the prompts make the assistant read Publora's and ElevenLabs' current docs before writing integration code.
- **Uniqueness:** every idea is checked against the brand's past-reels ledger (metaphors, transition order, stage colors).

## Tools referenced
- [ElevenLabs](https://elevenlabs.io): voiceover. One file per beat keeps the edit frame-accurate.
- [Publora](https://publora.com): a scheduling API for Instagram (Reels), TikTok and more (`https://api.publora.com/api/v1`, `x-publora-key` header).
