// Shared helpers for the library / Pexels scripts: Remotion's bundled
// ffmpeg + ffprobe, the manifest, contact sheets and .env.

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const LIBRARY = join(ROOT, "public", "library");
export const MANIFEST = join(ROOT, "assets", "manifest.json");
const CLI = join(ROOT, "node_modules", "@remotion", "cli", "remotion-cli.js");

export const VIDEO_EXT = new Set([".mp4", ".mov", ".webm"]);
export const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function die(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

function remotion(args) {
  const res = spawnSync(process.execPath, [CLI, ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (res.status !== 0) throw new Error(`remotion ${args[0]} failed: ${(res.stderr || "").slice(-400)}`);
  return res.stdout;
}

// { width, height, duration (s), fps } — duration/fps are 0 for stills.
export function probe(file) {
  const out = JSON.parse(
    remotion(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate:format=duration", "-of", "json", file]),
  );
  const s = out.streams?.[0] ?? {};
  const [num, den] = String(s.r_frame_rate ?? "0/1").split("/").map(Number);
  const still = IMAGE_EXT.has(extname(file).toLowerCase());
  return {
    width: s.width ?? 0,
    height: s.height ?? 0,
    duration: still ? 0 : Number(Number(out.format?.duration ?? 0).toFixed(2)),
    fps: still || !den ? 0 : Number((num / den).toFixed(2)),
  };
}

// One JPEG frame at `t` seconds, scaled to `width` px wide.
export function frameAt(file, t, out, width = 240) {
  mkdirSync(dirname(out), { recursive: true });
  rmSync(out, { force: true });
  remotion(["ffmpeg", "-v", "error", "-y", "-ss", String(t), "-i", file, "-frames:v", "1", "-vf", `scale=${width}:-2`, "-pix_fmt", "yuvj420p", "-q:v", "4", out]);
  if (!existsSync(out)) throw new Error(`no frame written for ${file} at ${t}s`);
}

export function sha1(file) {
  return createHash("sha1").update(readFileSync(file)).digest("hex");
}

export function slug(s) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function readManifest() {
  if (!existsSync(MANIFEST)) return { version: 1, assets: [] };
  return JSON.parse(readFileSync(MANIFEST, "utf8"));
}

export function writeManifest(m) {
  mkdirSync(dirname(MANIFEST), { recursive: true });
  m.assets.sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(MANIFEST, `${JSON.stringify(m, null, 2)}\n`);
}

// Tiles labelled rows of thumbnails into one JPEG (Python + Pillow via uv,
// since Remotion's ffmpeg build has no tile/drawtext filters).
// rows: [{ label, frames: [jpgPath, ...] }]
export function contactSheet(rows, out) {
  mkdirSync(dirname(out), { recursive: true });
  const spec = join(dirname(out), `${Date.now()}-sheet.json`);
  writeFileSync(spec, JSON.stringify({ rows, out }));
  const res = spawnSync("uv", ["run", "--quiet", join(ROOT, "scripts", "sheet.py"), spec], { cwd: ROOT, encoding: "utf8", stdio: "inherit" });
  if (res.status !== 0) die("contact sheet failed (needs uv: https://docs.astral.sh/uv/)");
}

// KEY=value lines from .env (no quotes/expansion needed here).
export function env(key) {
  if (process.env[key]) return process.env[key];
  const file = join(ROOT, ".env");
  if (!existsSync(file)) return "";
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && m[1] === key) return m[2].replace(/^["']|["']$/g, "");
  }
  return "";
}
