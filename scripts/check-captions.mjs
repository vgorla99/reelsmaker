// Self-check for src/footage/Captions.tsx: sentences the headline / CTA button
// already shows are skipped, everything else is captioned in 1–3 word chunks.
//
//   node scripts/check-captions.mjs

import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { buildSync } from "esbuild";
import { ROOT } from "./lib/media.mjs";

const out = join(ROOT, "out", "_tmp", "captions-check.mjs");
mkdirSync(join(ROOT, "out", "_tmp"), { recursive: true });
buildSync({ entryPoints: [join(ROOT, "src", "footage", "Captions.tsx")], bundle: true, platform: "node", format: "esm", packages: "external", outfile: out, logLevel: "error" });
const { captionChunks } = await import(pathToFileURL(out).href);

const line = { from: 0, to: 120, at: 0 };
const shown = (text, head) => captionChunks([line], [{ text, head }]).map((c) => c.words.map((w) => w.text).join(" "));

// Number words match the headline's digits; the new part of the line stays.
assert.deepEqual(shown("Acht Zutaten. Ein Snack. Was steckt drin?", "8 ZUTATEN. 1 SNACK."), ["Was steckt drin?"]);
assert.deepEqual(shown("Eins: kürzer, dafür öfter. Drei kleine Runden statt einer großen.", "1. KÜRZER, DAFÜR ÖFTER."), ["Drei kleine Runden", "statt einer großen."]);
// Filler words don't keep a sentence the headline already says.
assert.deepEqual(shown("Glucosamin ist ein Aminozucker. Der Körper nutzt ihn.", "GLUCOSAMIN: AMINOZUCKER."), ["Der Körper nutzt ihn."]);
// A word split over the headline's two lines still matches ("HUNDE-" / "JAHRE" is rejoined in fromPlan).
assert.deepEqual(shown("Leider ein Mythos.", "LEIDER EIN MYTHOS."), []);
// The CTA button covers "Link in Bio."
assert.deepEqual(shown("Alle Zutaten: Link in Bio.", "LINK IN BIO"), ["Alle Zutaten:"]);
// No headline -> everything is captioned.
assert.deepEqual(shown("Ich passe auf dich auf.", ""), ["Ich passe auf", "dich auf."]);
// Lone words fold into a neighbour; filler-only scraps between skipped sentences go.
assert.deepEqual(shown("Das ganze Etikett findest du über den Link in Bio.", "LINK IN BIO"), ["Das ganze Etikett", "findest du über", "den Link in Bio."]);
assert.deepEqual(shown("Und: Krallen kurz halten. Das gibt mehr Halt.", "KRALLEN KURZ HALTEN."), ["Das gibt mehr Halt."]);
console.log("captions check passed");
