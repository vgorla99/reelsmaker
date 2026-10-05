// Cut one ElevenLabs voiceover into its lines, at the pauses between them.
//
//   npm run vo -- <vo.mp3> --lines 5 [--noise -30] [--min 0.6] [--out vo.json] [--text lines.json]
//
// --text (a JSON array of the line texts) is the fallback when the break
// pauses got lost: cut by each line's share of the script instead.
//
// ElevenLabs leaves ~0.2 s between ANY two sentences, so the VO script puts
// <break time="1.0s" /> between lines; those long pauses are the cut points.
// Finds the silences (ffmpeg silencedetect), keeps the (lines - 1) longest,
// and prints [{ from, to }] in frames at 30 fps — the `vo.lines` a
// FootageSpec takes (the reel places each line on its own beat).

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, die, probe } from "./lib/media.mjs";

const FPS = 30;
const PRE_ROLL = 2; // frames kept before each line's first sound
const SNAP_WINDOW = 1.6; // s — how far a line end may sit from its text-length estimate
const MICRO_GAP = 0.12; // s — shorter gaps may be breaths inside a phrase, not phrase ends
const SNAP_COST = 0.15; // pause-seconds a candidate loses per second away from the estimate
const CLI = join(ROOT, "node_modules", "@remotion", "cli", "remotion-cli.js");

function parseArgs(argv) {
  const pos = [];
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) opt[argv[i].slice(2)] = argv[++i] ?? "";
    else pos.push(argv[i]);
  }
  return { pos, opt };
}

// [{ start, end }] in seconds.
function silences(file, noiseDb, minSec) {
  const res = spawnSync(
    process.execPath,
    [CLI, "ffmpeg", "-hide_banner", "-nostats", "-i", file, "-af", `silencedetect=noise=${noiseDb}dB:d=${minSec}`, "-f", "null", "-"],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  if (res.status !== 0) die(`silencedetect failed: ${(res.stderr || "").slice(-300)}`);
  const out = [];
  let start = null;
  for (const line of res.stderr.split(/\r?\n/)) {
    const s = /silence_start: (-?[\d.]+)/.exec(line);
    const e = /silence_end: ([\d.]+)/.exec(line);
    if (s) start = Math.max(0, Number(s[1]));
    if (e && start !== null) {
      out.push({ start, end: Number(e[1]) });
      start = null;
    }
  }
  return out;
}

// ElevenLabs pauses briefly after every phrase. If the short pauses match the
// script's phrase count one-to-one, each line ends at its last phrase's pause.
// A few extra very short gaps (breaths inside a word) are dropped first.
function byPunctuation(texts, inner) {
  const len = (s) => s.end - s.start;
  for (const marks of [/[.?!:](\s|$)/g, /[.?!:,](\s|$)/g]) {
    const phrases = texts.map((t) => (t.trim().match(marks) ?? []).length || 1);
    const extra = inner.length - (phrases.reduce((a, b) => a + b, 0) - 1);
    if (extra < 0) continue;
    const dropped = [...inner].sort((a, b) => len(a) - len(b)).slice(0, extra);
    if (dropped.some((s) => len(s) >= MICRO_GAP)) continue;
    const gaps = inner.filter((s) => !dropped.includes(s));
    let at = 0;
    console.warn(`! no long break pauses — cut at phrase pauses (${gaps.length} pauses = script phrases, ${extra} micro-gap(s) ignored); check the result`);
    return phrases.slice(0, -1).map((p) => gaps[(at += p) - 1]);
  }
  return null;
}

// Fallback: estimate each line's end from its share of the script, then snap
// to the best short pause near that estimate (a longer pause wins ties).
function byLength(texts, inner, speechFrom, speechTo) {
  const weight = texts.map((t) => t.replace(/[^\p{L}\p{N}]/gu, "").length);
  const sum = weight.reduce((a, b) => a + b, 0);
  const cuts = [];
  let acc = 0;
  for (let k = 0; k < texts.length - 1; k++) {
    acc += weight[k];
    const est = speechFrom + (acc / sum) * (speechTo - speechFrom);
    const after = cuts.length ? cuts[cuts.length - 1].end : speechFrom;
    const dist = (s) => Math.abs((s.start + s.end) / 2 - est);
    const score = (s) => s.end - s.start - SNAP_COST * dist(s);
    const pick = inner.filter((s) => s.start > after && dist(s) < SNAP_WINDOW).sort((a, b) => score(b) - score(a))[0];
    if (!pick) die(`no pause near ${est.toFixed(2)} s for the end of line ${k + 1} — re-record with longer pauses between lines`);
    cuts.push(pick);
  }
  console.warn("! no long break pauses — cut by script length + nearest short pauses; CHECK the result");
  return cuts;
}

const { pos, opt } = parseArgs(process.argv.slice(2));
const file = pos[0];
const n = Number(opt.lines);
if (!file || !Number.isInteger(n) || n < 1) die("usage: npm run vo -- <vo.mp3> --lines <n> [--noise -30] [--min 0.6] [--out vo.json]");

const total = probe(file).duration;
const innerOf = (list) => list.filter((s) => s.start > 0.05 && s.end < total - 0.05);
let all = silences(file, Number(opt.noise ?? -30), Number(opt.min ?? 0.6));
let inner = innerOf(all);
let cuts;
if (inner.length >= n - 1) {
  if (inner.length > n - 1) console.warn(`! ${inner.length} long pauses for ${n} lines — cutting at the ${n - 1} longest; check the result`);
  cuts = inner
    .sort((a, b) => b.end - b.start - (a.end - a.start))
    .slice(0, n - 1)
    .sort((a, b) => a.start - b.start);
} else if (opt.text) {
  // Break tags got lost: estimate each line's end from its share of the script,
  // then snap to the best short pause near that estimate (longer pause wins ties).
  const texts = JSON.parse(readFileSync(opt.text, "utf8"));
  if (texts.length !== n) die(`--text has ${texts.length} lines, expected ${n}`);
  all = silences(file, -35, 0.08);
  inner = innerOf(all);
  const speechFrom = all.find((s) => s.start <= 0.05)?.end ?? 0;
  const speechTo = all.find((s) => s.end >= total - 0.05)?.start ?? total;
  cuts = byPunctuation(texts, inner) ?? byLength(texts, inner, speechFrom, speechTo);
} else die(`found ${inner.length} long pauses, need ${n - 1} — was each line separated by <break time="1.0s" />?`);

const lead = all.find((s) => s.start <= 0.05);
const trail = all.find((s) => s.end >= total - 0.05);
const bounds = [lead ? lead.end : 0, ...cuts.flatMap((c) => [c.start, c.end]), trail ? trail.start : total];

const lines = [];
for (let i = 0; i < n; i++) {
  const from = Math.max(0, Math.floor(bounds[2 * i] * FPS) - PRE_ROLL);
  const to = Math.ceil(bounds[2 * i + 1] * FPS) + 3;
  lines.push({ from, to });
}

console.log(`${file}: ${total}s, ${all.length} silences, cuts at ${cuts.map((c) => ((c.start + c.end) / 2).toFixed(2)).join(", ")} s`);
lines.forEach((l, i) => console.log(`  line ${i + 1}: frames ${l.from}–${l.to}  (${((l.to - l.from) / FPS).toFixed(2)} s)`));
if (opt.out) {
  writeFileSync(opt.out, `${JSON.stringify({ src: file, lines }, null, 2)}\n`);
  console.log(`→ ${opt.out}`);
}
