// Asset library: clips and stills the footage reels may use, with where they
// came from and whether we may use them. Files live in public/library/
// (gitignored); their records live in assets/manifest.json (tracked).
//
//   npm run library -- scan <dir> [--limit 60]       contact sheet of a folder, adds nothing
//   npm run library -- add <file>... --source own-ai|own-real [--name short-name] [--tags a,b] [--issues "..."]
//   npm run library -- sheet [--source pexels] [--tag dog]
//   npm run library -- list
//
// Pexels clips are added by scripts/pexels.mjs.

import { copyFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import {
  IMAGE_EXT,
  LIBRARY,
  ROOT,
  VIDEO_EXT,
  contactSheet,
  die,
  frameAt,
  probe,
  readManifest,
  sha1,
  slug,
  writeManifest,
} from "./lib/media.mjs";

const SHEETS = join(ROOT, "out", "_sheets");
const OWN_SOURCES = new Set(["own-ai", "own-real"]);

function parseArgs(argv) {
  const pos = [];
  const opt = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) opt[argv[i].slice(2)] = argv[++i] ?? "";
    else pos.push(argv[i]);
  }
  return { pos, opt };
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    const ext = extname(name).toLowerCase();
    return VIDEO_EXT.has(ext) || IMAGE_EXT.has(ext) ? [p] : [];
  });
}

const kindOf = (file) => (VIDEO_EXT.has(extname(file).toLowerCase()) ? "video" : "image");

// Three frames across a video (10 / 50 / 90 %), or the still itself
// (Pillow reads stills directly; Remotion's ffmpeg can't decode PNG).
function thumbs(file, key, meta) {
  const dir = join(SHEETS, "_frames");
  if (kindOf(file) === "image") return [file];
  return [0.1, 0.5, 0.9].map((p, i) => {
    const out = join(dir, `${key}-${i}.jpg`);
    frameAt(file, (meta.duration * p).toFixed(2), out);
    return out;
  });
}

const describe = (m) => (m.duration ? `${m.width}x${m.height} ${m.duration}s ${m.fps}fps` : `${m.width}x${m.height} still`);

function scan(dir, limit) {
  const files = walk(dir).slice(0, limit);
  if (!files.length) die(`no media under ${dir}`);
  const rows = files.map((file, i) => {
    process.stdout.write(`\r  ${i + 1}/${files.length}`);
    const name = relative(dir, file).slice(-60);
    try {
      const meta = probe(file);
      return { label: `#${i + 1} ${describe(meta)} | ${name}`, frames: thumbs(file, `scan-${slug(basename(dir))}-${i}`, meta) };
    } catch (e) {
      console.error(`\n  ! #${i + 1} unreadable: ${name} (${String(e.message).slice(-120)})`);
      return { label: `#${i + 1} UNREADABLE | ${name}`, frames: [] };
    }
  });
  console.log("");
  files.forEach((f, i) => console.log(`#${i + 1}\t${f}`));
  contactSheet(rows, join(SHEETS, `scan-${slug(basename(dir))}.jpg`));
}

function add(files, opt) {
  const source = opt.source;
  if (!OWN_SOURCES.has(source)) die(`--source must be one of: ${[...OWN_SOURCES].join(", ")}`);
  const m = readManifest();
  for (const file of files) {
    const hash = sha1(file);
    if (m.assets.some((a) => a.sha1 === hash)) {
      console.log(`= already in library: ${file}`);
      continue;
    }
    const ext = extname(file).toLowerCase();
    const id = `${source}-${slug(opt.name && files.length === 1 ? opt.name : basename(file, ext))}-${hash.slice(0, 6)}`;
    const dest = join(LIBRARY, source, `${id}${ext}`);
    mkdirSync(join(LIBRARY, source), { recursive: true });
    copyFileSync(file, dest);
    const meta = probe(dest);
    m.assets.push({
      id,
      file: `library/${source}/${id}${ext}`,
      kind: kindOf(file),
      source,
      ...meta,
      ai: source === "own-ai",
      license: "own",
      origin: basename(file), // file name only: the manifest is committed, never record local absolute paths
      tags: opt.tags ? opt.tags.split(",").map((t) => t.trim()) : [],
      issues: opt.issues ?? "",
      sha1: hash,
    });
    console.log(`+ ${id}  (${describe(meta)})`);
  }
  writeManifest(m);
}

function sheet(opt) {
  const assets = readManifest().assets.filter((a) => (!opt.source || a.source === opt.source) && (!opt.tag || a.tags.includes(opt.tag)));
  if (!assets.length) die("no matching assets");
  const rows = assets.map((a) => ({
    label: `${a.id} | ${describe(a)}${a.ai ? " AI" : ""} | ${a.tags.join(",")}${a.issues ? ` | ! ${a.issues}` : ""}`,
    frames: thumbs(join(ROOT, "public", a.file), a.id, a),
  }));
  contactSheet(rows, join(SHEETS, `library-${opt.source ?? "all"}${opt.tag ? `-${opt.tag}` : ""}.jpg`));
}

const [cmd, ...rest] = process.argv.slice(2);
const { pos, opt } = parseArgs(rest);
if (cmd === "scan" && pos[0]) scan(pos[0], Number(opt.limit ?? 60));
else if (cmd === "add" && pos.length) add(pos, opt);
else if (cmd === "sheet") sheet(opt);
else if (cmd === "list") for (const a of readManifest().assets) console.log(`${a.id}\t${describe(a)}\t${a.tags.join(",")}`);
else die("usage: npm run library -- scan <dir> | add <file>... --source own-ai|own-real | sheet | list");
