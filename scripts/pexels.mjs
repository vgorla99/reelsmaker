// Pexels stock video -> asset library, with the author, source URL and
// license recorded in assets/manifest.json. Needs PEXELS_API_KEY in .env.
//
//   npm run pexels -- search "senior dog stairs" [--n 15] [--min 6] [--page 1]
//   npm run pexels -- get <id>... [--name short-name] [--tags a,b]
//
// Lifestyle only: never use a stock person as if they use or endorse the brand.
// Limits: 200 requests/hour, 20,000/month (the remaining quota is printed).

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LIBRARY, ROOT, contactSheet, die, env, probe, readManifest, sha1, slug, writeManifest } from "./lib/media.mjs";

const API = "https://api.pexels.com";
const FRAMES = join(ROOT, "out", "_sheets", "_frames");
const TARGET_W = 1080;

const key = env("PEXELS_API_KEY");
if (!key) die("PEXELS_API_KEY is missing — add it to .env");

function parseArgs(argv) {
  const pos = [];
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) opt[argv[i].slice(2)] = argv[++i] ?? "";
    else pos.push(argv[i]);
  }
  return { pos, opt };
}

async function api(path) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: key } });
  const left = res.headers.get("x-ratelimit-remaining");
  if (left !== null && Number(left) < 50) console.warn(`! Pexels quota low: ${left} requests left this month`);
  if (!res.ok) die(`Pexels ${res.status} ${res.statusText} for ${path}`);
  return res.json();
}

async function download(url, out) {
  const res = await fetch(url);
  if (!res.ok) die(`download failed (${res.status}): ${url}`);
  writeFileSync(out, Buffer.from(await res.arrayBuffer()));
}

// Portrait file closest to 1080 wide (4K only if nothing else), 30 fps or less preferred.
function bestFile(video) {
  const files = video.video_files.filter((f) => f.file_type === "video/mp4" && f.height > f.width && f.width >= 720);
  if (!files.length) return null;
  const score = (f) => Math.abs(f.width - TARGET_W) + (f.fps > 31 ? 500 : 0);
  return files.sort((a, b) => score(a) - score(b))[0];
}

async function search(query, opt) {
  const n = Number(opt.n ?? 15);
  const min = Number(opt.min ?? 6);
  const q = new URLSearchParams({ query, orientation: "portrait", size: "medium", per_page: String(n), page: String(opt.page ?? 1) });
  const data = await api(`/videos/search?${q}`);
  const videos = data.videos.filter((v) => v.duration >= min && bestFile(v));
  if (!videos.length) die(`no portrait clips >= ${min}s for "${query}"`);
  mkdirSync(FRAMES, { recursive: true });
  const rows = [];
  for (const v of videos) {
    const pics = v.video_pictures.filter((_, i, all) => [0, Math.floor(all.length / 2), all.length - 1].includes(i));
    const frames = [];
    for (const [i, p] of pics.entries()) {
      const out = join(FRAMES, `pexels-${v.id}-${i}.jpg`);
      await download(p.picture, out);
      frames.push(out);
    }
    const f = bestFile(v);
    rows.push({ label: `${v.id} ${f.width}x${f.height} ${v.duration}s | ${v.user.name}`, frames });
    console.log(`${v.id}\t${v.duration}s\t${f.width}x${f.height}@${Math.round(f.fps)}\t${v.user.name}\t${v.url}`);
  }
  contactSheet(rows, join(ROOT, "out", "_sheets", `pexels-${slug(query)}.jpg`));
}

async function get(ids, opt) {
  const m = readManifest();
  for (const id of ids) {
    if (m.assets.some((a) => a.source === "pexels" && a.pexelsId === Number(id))) {
      console.log(`= pexels ${id} already in library`);
      continue;
    }
    const v = await api(`/videos/videos/${id}`);
    const f = bestFile(v);
    if (!f) die(`pexels ${id} has no portrait mp4 >= 720 wide`);
    const name = slug(opt.name && ids.length === 1 ? opt.name : v.url.split("/").filter(Boolean).pop().replace(/-\d+$/, ""));
    const assetId = `pexels-${name}-${id}`;
    const file = `library/pexels/${assetId}.mp4`;
    mkdirSync(join(LIBRARY, "pexels"), { recursive: true });
    const dest = join(ROOT, "public", file);
    await download(f.link, dest);
    const meta = probe(dest);
    m.assets.push({
      id: assetId,
      file,
      kind: "video",
      source: "pexels",
      ...meta,
      ai: false,
      license: "Pexels License (free use, no attribution required; no implied endorsement)",
      author: v.user.name,
      authorUrl: v.user.url,
      url: v.url,
      pexelsId: v.id,
      tags: opt.tags ? opt.tags.split(",").map((t) => t.trim()) : [],
      issues: "",
      sha1: sha1(dest),
    });
    console.log(`+ ${assetId}  (${meta.width}x${meta.height} ${meta.duration}s ${meta.fps}fps, ${v.user.name})`);
  }
  writeManifest(m);
}

const [cmd, ...rest] = process.argv.slice(2);
const { pos, opt } = parseArgs(rest);
if (cmd === "search" && pos[0]) await search(pos.join(" "), opt);
else if (cmd === "get" && pos.length) await get(pos, opt);
else die('usage: npm run pexels -- search "<query>" [--n 15] [--min 6] | get <id>... [--name x] [--tags a,b]');
