// Publora: schedule approved final videos to TikTok. Needs PUBLORA_API_KEY in .env.
//
//   npm run publora -- connections                 list connected accounts (read-only)
//   npm run publora -- status                      scheduled posts + remaining Starter slots (read-only)
//   npm run publora -- schedule 2026-10 V01[,V03]  upload final.mp4 + schedule at the plan's date/time (Berlin)
//
// Only run `schedule` after Vitor's "approve schedule" for those IDs.
// Starter plan: 15 posts/month per platform, max 3 pending, max 7 days ahead.
// Publora can't set TikTok's AI label or first comment → only AI-free videos, first comment by hand.

import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, die, env } from "./lib/media.mjs";

const API = "https://api.publora.com/api/v1";
const MAX_PENDING = 3;
const HORIZON_DAYS = 7;
const key = env("PUBLORA_API_KEY");
if (!key) die("PUBLORA_API_KEY is missing — add it to .env");

async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "x-publora-key": key, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  if (!res.ok || json.success === false) die(`Publora ${method} ${path} → ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
  return json;
}

async function tiktokId() {
  const fromEnv = env("PUBLORA_TIKTOK_ID");
  if (fromEnv) return fromEnv;
  const { connections } = await call("GET", "/platform-connections");
  const tk = connections.filter((c) => c.platformId.startsWith("tiktok-"));
  if (tk.length !== 1) die(`expected exactly 1 TikTok connection, found ${tk.length} — set PUBLORA_TIKTOK_ID in .env`);
  return tk[0].platformId;
}

// "2026-10-01" + "20:30" in Europe/Berlin -> ISO UTC (handles the 25 Oct DST switch).
function berlinToUtc(date, time) {
  const guess = new Date(`${date}T${time}:00Z`);
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", timeZoneName: "shortOffset" })
    .formatToParts(guess)
    .find((p) => p.type === "timeZoneName").value; // "GMT+2"
  const hours = Number(offset.replace("GMT", "") || 0);
  return new Date(guess.getTime() - hours * 3600_000).toISOString();
}

async function pending() {
  const { posts } = await call("GET", "/list-posts?status=scheduled&limit=100&sortBy=scheduledTime&sortOrder=asc");
  return posts;
}

async function schedule(month, ids) {
  const plan = JSON.parse(readFileSync(join(ROOT, "content", month, "plan.json"), "utf8"));
  const manifest = JSON.parse(readFileSync(join(ROOT, "assets", "manifest.json"), "utf8"));
  const ai = new Set(manifest.assets.filter((a) => a.ai).map((a) => a.id));
  const ledgerPath = join(ROOT, "content", month, "schedule.json");
  const ledger = existsSync(ledgerPath) ? JSON.parse(readFileSync(ledgerPath, "utf8")) : {};
  const platform = await tiktokId();
  let queued = (await pending()).length;

  for (const id of ids) {
    const v = plan.videos.find((x) => x.id === id);
    if (!v) die(`${id} is not in the ${month} plan`);
    if (v.posting !== "publora") die(`${id} is a manual post (posting: ${v.posting})`);
    if (ledger[id]) die(`${id} is already scheduled (postGroupId ${ledger[id].postGroupId})`);
    if (v.beats.some((b) => b.shot?.asset && ai.has(b.shot.asset))) die(`${id} contains own AI clips — post manually with TikTok's AI label`);
    const file = join(ROOT, "out", month, `${v.id}-${v.slug}`, "final.mp4");
    if (!existsSync(file)) die(`${id}: no final.mp4 yet (npm run produce -- ${month} --final ${id})`);
    const when = berlinToUtc(v.date, plan.defaults.videoTime);
    const days = (new Date(when) - Date.now()) / 86_400_000;
    if (days <= 0) die(`${id}: ${when} is in the past`);
    if (days > HORIZON_DAYS) die(`${id}: ${v.date} is more than ${HORIZON_DAYS} days ahead (Starter) — schedule it later`);
    if (queued >= MAX_PENDING) die(`already ${queued} scheduled posts pending (Starter max ${MAX_PENDING}) — wait until one publishes`);

    const content = `${v.caption}\n\n${[...v.hashtags, ...plan.defaults.baseTags].join(" ")}`;
    const draft = await call("POST", "/create-post", { content, platforms: [platform] });
    const up = await call("POST", "/get-upload-url", { fileName: `${v.id}-${v.slug}.mp4`, contentType: "video/mp4", type: "video", postGroupId: draft.postGroupId });
    const put = await fetch(up.uploadUrl, { method: "PUT", headers: { "Content-Type": "video/mp4" }, body: readFileSync(file) });
    if (!put.ok) die(`${id}: upload failed (${put.status})`);
    const done = await call("PUT", `/update-post/${draft.postGroupId}`, {
      status: "scheduled",
      scheduledTime: when,
      platformSettings: {
        tiktok: { viewerSetting: "PUBLIC_TO_EVERYONE", allowComments: true, allowDuet: false, allowStitch: false, commercialContent: true, brandOrganic: true, brandedContent: false },
      },
    });
    queued++;
    ledger[id] = { postGroupId: draft.postGroupId, scheduledTime: done.scheduledTime ?? when, file: `${v.id}-${v.slug}/final.mp4`, mb: +(statSync(file).size / 1048576).toFixed(1) };
    writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
    console.log(`✔ ${id} scheduled for ${v.date} ${plan.defaults.videoTime} (Berlin) → ${ledger[id].scheduledTime}  [${draft.postGroupId}]`);
  }
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "connections") {
  const { connections } = await call("GET", "/platform-connections");
  for (const c of connections) console.log(`${c.platformId}\t${c.username ?? ""}\t${c.displayName ?? ""}`);
} else if (cmd === "status") {
  const posts = await pending();
  for (const p of posts) console.log(`${p.scheduledTime}\t${p.postGroupId}\t${String(p.content).slice(0, 60).replace(/\n/g, " ")}`);
  console.log(`${posts.length}/${MAX_PENDING} pending slots used`);
} else if (cmd === "schedule" && rest[0] && rest[1]) await schedule(rest[0], rest[1].split(","));
else die("usage: npm run publora -- connections | status | schedule <YYYY-MM> <ID[,ID]>");
