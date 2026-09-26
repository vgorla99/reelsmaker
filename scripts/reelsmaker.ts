// ReelsMaker CLI — script JSON in, verified Instagram-spec MP4 out.
//
//   npm run reelsmaker -- --script=scripts/reelsmaker/my-reel.json
//
// Steps: resolve brand -> validate -> render "ReelsMaker" composition ->
// ffprobe spec check (1080x1920, 30fps, exact frame count) -> contact sheet.
//
// Runs on Node >= 22.18 via built-in TypeScript type stripping (no build
// step). Only erasable TS syntax is allowed here (see tsconfig).

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CONTACT_SHEET_FRAMES, REEL_DURATION, REEL_FPS, REEL_HEIGHT, REEL_WIDTH } from "../src/beats.ts";
import { validateProps } from "../src/validate.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const REMOTION_CLI = join(ROOT, "node_modules", "@remotion", "cli", "remotion-cli.js");
const ENTRY = "src/index.ts";
const COMPOSITION = "ReelsMaker";
const SHEET_COMPOSITION = "ReelsMakerContactSheet";

const USAGE = `ReelsMaker — render an Instagram reel from a script JSON.

Usage:
  npm run reelsmaker -- --script=<file.json> [options]

Options:
  --script=<file>   Script JSON (required). See scripts/reelsmaker/*.json.
  --out=<file.mp4>  Output path. Default: out/<script-name>.mp4
  --check           Validate only; don't render.
  --no-sheet        Skip the contact-sheet still.
  --help            Show this help.`;

interface Args {
  script?: string;
  out?: string;
  check: boolean;
  sheet: boolean;
  help: boolean;
}

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

function parseArgs(argv: string[]): Args {
  const args: Args = { check: false, sheet: true, help: false };
  for (const a of argv) {
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--check") args.check = true;
    else if (a === "--no-sheet") args.sheet = false;
    else if (a.startsWith("--script=")) args.script = a.slice("--script=".length);
    else if (a.startsWith("--out=")) args.out = a.slice("--out=".length);
    else fail(`Unknown argument "${a}"\n\n${USAGE}`);
  }
  return args;
}

function readJson(path: string, what: string): unknown {
  if (!existsSync(path)) fail(`${what} not found: ${relative(ROOT, path) || path}`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    fail(`${what} is not valid JSON (${relative(ROOT, path)}): ${e instanceof Error ? e.message : String(e)}`);
  }
}

// `"brand": "demo"` -> brands/demo.json; an inline object is used as-is.
function resolveBrand(script: Record<string, unknown>): unknown {
  const ref = script.brand;
  if (typeof ref !== "string") return ref;
  if (!/^[\w-]+$/.test(ref)) fail(`brand "${ref}" must be a plain name (letters, digits, - or _) matching brands/<name>.json`);
  return readJson(join(ROOT, "brands", `${ref}.json`), `Brand "${ref}"`);
}

function remotion(args: string[], capture = false): string {
  if (!existsSync(REMOTION_CLI)) fail("Remotion CLI not found — run `npm install` first.");
  const res = spawnSync(process.execPath, [REMOTION_CLI, ...args], {
    cwd: ROOT,
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
    encoding: "utf8",
  });
  if (res.error) fail(`Failed to run remotion ${args[0]}: ${res.error.message}`);
  if (res.status !== 0) fail(`remotion ${args[0]} exited with code ${res.status}`);
  return res.stdout ?? "";
}

interface ProbeResult {
  streams?: { width?: number; height?: number; r_frame_rate?: string; nb_read_frames?: string }[];
}

function checkSpec(file: string): boolean {
  const raw = remotion(
    ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries", "stream=width,height,r_frame_rate,nb_read_frames", "-of", "json", file],
    true,
  );
  const s = (JSON.parse(raw) as ProbeResult).streams?.[0];
  if (!s) fail(`ffprobe found no video stream in ${file}`);
  const frames = Number(s.nb_read_frames);
  const checks: [string, boolean, string][] = [
    ["resolution", s.width === REEL_WIDTH && s.height === REEL_HEIGHT, `${s.width}x${s.height} (want ${REEL_WIDTH}x${REEL_HEIGHT})`],
    ["frame rate", s.r_frame_rate === `${REEL_FPS}/1`, `${s.r_frame_rate} (want ${REEL_FPS}/1)`],
    ["frame count", frames === REEL_DURATION, `${frames} (want ${REEL_DURATION} = ${REEL_DURATION / REEL_FPS}s)`],
  ];
  console.log("\nInstagram spec check (ffprobe):");
  for (const [name, ok, detail] of checks) console.log(`  ${ok ? "✔" : "✖"} ${name}: ${detail}`);
  return checks.every(([, ok]) => ok);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.script) {
    console.log(USAGE);
    process.exit(args.help ? 0 : 1);
  }

  const scriptPath = resolve(process.cwd(), args.script);
  const script = readJson(scriptPath, "Script");
  if (typeof script !== "object" || script === null || Array.isArray(script)) fail("Script must be a JSON object");
  const scriptObj = script as Record<string, unknown>;

  const result = validateProps({ ...scriptObj, brand: resolveBrand(scriptObj) });
  for (const w of result.warnings) console.warn(`  ⚠ ${w}`);
  if (!result.ok) fail(`Script ${relative(ROOT, scriptPath)} has ${result.errors.length} error(s):\n  - ${result.errors.join("\n  - ")}`);
  console.log(`✔ ${relative(ROOT, scriptPath)} is valid (brand: ${result.value.brand.name}, morphPath: ${result.value.morphPath ?? "classic"})`);
  if (args.check) return;

  const slug = basename(scriptPath, extname(scriptPath));
  const outFile = resolve(ROOT, args.out ?? join("out", `${slug}.mp4`));
  const propsFile = join(ROOT, "out", ".reelsmaker", `${slug}.props.json`);
  mkdirSync(dirname(propsFile), { recursive: true });
  mkdirSync(dirname(outFile), { recursive: true });
  // Nested under `reel` — see ReelEntryProps in src/types.ts.
  writeFileSync(propsFile, JSON.stringify({ reel: result.value }, null, 2));

  console.log(`\nRendering ${COMPOSITION} -> ${relative(ROOT, outFile)}`);
  remotion(["render", ENTRY, COMPOSITION, outFile, `--props=${propsFile}`]);
  const specOk = checkSpec(outFile);

  if (args.sheet) {
    const sheetFile = outFile.replace(/\.mp4$/i, "") + "-contact-sheet.png";
    console.log(`\nRendering contact sheet (frames ${CONTACT_SHEET_FRAMES.join(", ")})`);
    remotion(["still", ENTRY, SHEET_COMPOSITION, sheetFile, `--props=${propsFile}`, "--frame=0"]);
    console.log(`✔ Contact sheet: ${relative(ROOT, sheetFile)}`);
  }

  if (!specOk) fail("Rendered file does not meet the Instagram spec (see above).");
  console.log(`\n✔ Done: ${relative(ROOT, outFile)}`);
}

main();
