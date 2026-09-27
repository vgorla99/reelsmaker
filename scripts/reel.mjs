// npm run reel -- <ReelId> [--review-only]
// Renders out/<ReelId>.mp4, checks it against the Instagram spec with
// ffprobe, then renders the review sheet out/<ReelId>-review.png.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cli = join(root, "node_modules", "@remotion", "cli", "remotion-cli.js");
const [id, flag] = process.argv.slice(2);

if (!id || !/^[A-Za-z0-9-]+$/.test(id)) {
  console.error("Usage: npm run reel -- <ReelId> [--review-only]   (e.g. LiftForLater)");
  process.exit(1);
}
if (!existsSync(cli)) {
  console.error("Remotion CLI not found — run `npm install` first.");
  process.exit(1);
}

function remotion(args, capture = false) {
  const res = spawnSync(process.execPath, [cli, ...args], { cwd: root, stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit", encoding: "utf8" });
  if (res.status !== 0) {
    console.error(`\n✖ remotion ${args[0]} failed (exit ${res.status})`);
    process.exit(1);
  }
  return res.stdout ?? "";
}

const mp4 = join("out", `${id}.mp4`);
const png = join("out", `${id}-review.png`);

if (flag !== "--review-only") {
  remotion(["render", "src/index.ts", id, mp4]);
  const probe = JSON.parse(
    remotion(
      ["ffprobe", "-v", "error", "-select_streams", "v:0", "-count_frames", "-show_entries", "stream=width,height,r_frame_rate,nb_read_frames", "-of", "json", mp4],
      true,
    ),
  );
  const s = probe.streams?.[0] ?? {};
  const frames = Number(s.nb_read_frames);
  const checks = [
    ["1080x1920", s.width === 1080 && s.height === 1920, `${s.width}x${s.height}`],
    ["30 fps", s.r_frame_rate === "30/1", s.r_frame_rate],
    ["<= 60s", frames > 0 && frames <= 1800, `${frames} frames = ${(frames / 30).toFixed(2)}s`],
  ];
  console.log("\nInstagram spec:");
  for (const [name, ok, got] of checks) console.log(`  ${ok ? "✔" : "✖"} ${name}  (${got})`);
  if (!checks.every(([, ok]) => ok)) process.exit(1);
}

remotion(["still", "src/index.ts", `${id}-Review`, png, "--frame=0"]);
console.log(`\n✔ ${flag === "--review-only" ? "" : `${mp4}  +  `}${png}`);
