# ReelsMaker script reference

A script is one JSON file, usually in `scripts/reelsmaker/`. The CLI validates it before rendering (`--check` validates only). The authoritative definitions are `src/types.ts` (shape) and `src/validate.ts` (rules).

## Brand

| Field   | Type                         | Notes                                                               |
| ------- | ---------------------------- | ------------------------------------------------------------------- |
| `brand` | string \| BrandConfig object | `"acme"` resolves to `brands/acme.json`; or inline the full object. |

BrandConfig: `name`, `handle`, `shortMark { prefix, suffix }`, `colors { bg, ink, body, faint, line, card, accents[3] }` (all `#rrggbb`), `fonts { headline, body }`.

## Beat content

| Field                | Beat    | Required | Type / range                         | Guideline                                   |
| -------------------- | ------- | -------- | ------------------------------------ | ------------------------------------------- |
| `kicker`             | hook    | yes      | string                               | 1–3 words, e.g. `HEALTH 101`                |
| `hook`               | hook    | yes      | string, `\n` = line break            | 2 lines, **≤ 24 chars/line** (warned)       |
| `hookTypeVariant`    | hook    | no       | `"kinetic"` (default) \| `"buildup"` | buildup: about 6 words or fewer             |
| `problemLine`        | problem | yes      | string                               | 1–2 sentences, **≤ 170 chars** (warned)     |
| `problemTypeVariant` | problem | no       | `"stagger"` (default) \| `"buildup"` | buildup: about 20 words or fewer            |
| `pointATitle`        | pointA  | yes      | string                               | ≤ 24 chars                                  |
| `pointABody`         | pointA  | yes      | string                               | **≤ 110 chars** (warned)                    |
| `pointAVariant`      | pointA  | no       | `"radial"` (default) \| `"seesaw"`   |                                             |
| `pointAStatTo`       | pointA  | radial   | number 0–100                         | ring %                                      |
| `pointAStatLabel`    | pointA  | radial   | string                               | ≤ 40 chars, reads after the number          |
| `pointAStatFrom`     | pointA  | no       | number 0–100                         | reserved (the ring always animates from 0)  |
| `pointALeftLabel`    | pointA  | seesaw   | string                               | the heavier, winning side                   |
| `pointARightLabel`   | pointA  | seesaw   | string                               | the lighter cluster                         |
| `pointBTitle`        | pointB  | yes      | string                               | ≤ 24 chars                                  |
| `pointBBody`         | pointB  | yes      | string                               | **≤ 110 chars** (warned)                    |
| `pointBVariant`      | pointB  | no       | `"bar"` (default) \| `"orbit"`       |                                             |
| `pointBBeforeLabel`  | pointB  | bar      | string                               | e.g. `WEEK 0`                               |
| `pointBBeforeValue`  | pointB  | bar      | number ≥ 0                           |                                             |
| `pointBAfterLabel`   | pointB  | bar      | string                               | e.g. `WEEK 12`                              |
| `pointBAfterValue`   | pointB  | bar      | number ≥ 0                           | accent-colored bar                          |
| `pointBUnit`         | pointB  | no       | string                               | appended to values: `"°"`, `" KG"`, `" REPS"` |
| `pointBStatTo`       | pointB  | orbit    | number 0–100                         | % of 20 dots lit                            |
| `pointBStatLabel`    | pointB  | orbit    | string                               |                                             |
| `statLabel`          | stat    | yes      | string                               | ≤ 70 chars                                  |
| `statFrom`           | stat    | yes      | number                               | count-up start (usually 0)                  |
| `statTo`             | stat    | yes      | number                               | count-up end                                |
| `statSuffix`         | stat    | yes      | string (may be `""`)                 | `"%"`, `"×"`, `" KG"`                       |
| `ctaText`            | cta     | yes      | string                               | ≤ 20 chars, one line                        |
| `ctaSub`             | cta     | yes      | string                               | ≤ 50 chars                                  |

## Continuity + audio

| Field          | Type                                 | Notes                                                                                 |
| -------------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| `morphPath`    | `"classic"` (default) \| `"journey"` | Shared-element path, see [vocabulary.md](vocabulary.md#morphbar-the-shared-element). |
| `musicSrc`     | string                               | path under `public/`, e.g. `audio/bed.mp3`                                            |
| `musicVolume`  | number 0–1                           | default 0.25                                                                          |
| `voiceoverSrc` | string                               | path under `public/`                                                                  |
| `hookTimings`  | `[{ "startFrame": n }]`              | one entry per hook word, syncs `KineticWords` to a voiceover                          |
| `bodyTimings`  | `[{ "startFrame": n }]`              | one entry per `problemLine` word, syncs `Words` to a voiceover                        |

## Minimal valid script (all defaults)

```json
{
  "brand": "demo",
  "kicker": "TIP",
  "hook": "SHORT HOOK\nSECOND LINE.",
  "problemLine": "Why this matters, in one sentence.",
  "pointATitle": "POINT A", "pointABody": "One line of support.",
  "pointAStatLabel": "OF PEOPLE SEE THIS", "pointAStatTo": 60,
  "pointBTitle": "POINT B", "pointBBody": "One line of support.",
  "pointBBeforeLabel": "BEFORE", "pointBBeforeValue": 10,
  "pointBAfterLabel": "AFTER", "pointBAfterValue": 20,
  "statLabel": "IMPROVEMENT", "statFrom": 0, "statTo": 40, "statSuffix": "%",
  "ctaText": "DO THE THING.", "ctaSub": "One line of why."
}
```
