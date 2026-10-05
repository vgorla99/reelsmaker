// The monthly content document: content/<month>/plan.json -> one HTML file
// in "Content Production" (the Week 5 layout: collapsible cards, copy
// buttons, checklists). The plan is the single source; never edit the HTML.
//
//   npm run doc -- 2026-10

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, die } from "./lib/media.mjs";

const month = process.argv[2];
if (!month || !/^\d{4}-\d{2}$/.test(month)) die("usage: npm run doc -- <YYYY-MM>");
const planPath = join(ROOT, "content", month, "plan.json");
if (!existsSync(planPath)) die(`missing ${planPath}`);
const plan = JSON.parse(readFileSync(planPath, "utf8"));
const OUT_DIR = join(ROOT, "out", month);
const outFile = join(OUT_DIR, `CONTENT_${month}.html`);
const manifest = JSON.parse(readFileSync(join(ROOT, "assets", "manifest.json"), "utf8"));
const aiAssets = new Set(manifest.assets.filter((a) => a.ai).map((a) => a.id));

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const day = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "short" });
const folder = (item) => `out/${month}/${item.id}-${item.slug}/`;
const copy = (text) => `<div class="copy"><button onclick="copyBlock(this)">Copy</button><pre>${esc(text)}</pre></div>`;
const words = (s) => s.split(/\s+/).filter(Boolean).length;

// ElevenLabs script: one line per beat + the CTA line, separated by break tags
// so `npm run vo` can cut the file at the pauses.
function voScript(v) {
  const lines = [...v.beats.map((b) => b.vo), v.ctaVo];
  return lines.join(`\n${plan.defaults.voBreak}\n`);
}
const seconds = (v) => Math.round([...v.beats.map((b) => b.vo), v.ctaVo].reduce((s, l) => s + words(l) / 2.2 + 1, 0));
const usesAi = (v) => v.beats.some((b) => b.shot?.asset && aiAssets.has(b.shot.asset));

function beatRows(v) {
  return v.beats
    .map((b, i) => {
      const title = i === 0 ? v.hook : b.title;
      const visual = b.shot
        ? b.shot.asset
          ? `eigenes Material: <code>${esc(b.shot.asset)}</code>`
          : `Pexels: „${esc(b.shot.pexels)}“`
        : (!b.block || b.block.type === "none")
          ? "Grafik: nur Text + Punkt"
          : `Grafik: ${esc(b.block.type)}${b.block.verdict ? ` (${esc(b.block.verdict)})` : ""}${b.block.items ? ` — ${esc(b.block.items.join(" · "))}` : ""}`;
      const rows = b.rows ? `<div class="rows">${b.rows.map((r) => `${esc(r.label)} <b>${esc(r.value)}</b>`).join(" · ")}</div>` : "";
      return `<tr><td>${i === 0 ? "Hook" : i}</td><td><b>${esc(title[0])}</b><br><span class="gold">${esc(title[1])}</span>${b.note ? `<div class="note">${esc(b.note)}</div>` : ""}${rows}</td><td>${visual}</td><td>${esc(b.vo)}</td></tr>`;
    })
    .concat(`<tr><td>CTA</td><td><b>${esc(plan.defaults.cta.button)}</b><div class="note">${esc(plan.defaults.cta.note)}</div></td><td>Wortmarke + Button</td><td>${esc(v.ctaVo)}</td></tr>`)
    .join("");
}

function checklist(items) {
  return `<div class="checklist">${items.map((t) => `<div class="check" onclick="toggleCheck(this)"><span class="box"></span><span>${t}</span></div>`).join("")}</div>`;
}

function videoCard(v, n) {
  const ai = usesAi(v);
  const scheduled = v.posting === "publora";
  const pexels = v.beats.filter((b) => b.shot?.pexels).map((b) => b.shot.pexels);
  const steps = [
    `Stummes Draft ansehen: <code>${folder(v)}video.mp4</code> + <code>cover.png</code>`,
    `VO in ElevenLabs aufnehmen (Skript unten, Break-Tags drinlassen) → als <code>vo.mp3</code> in den Ordner legen`,
    `Claude: „VO für ${v.id} ist da“ → <code>final.mp4</code> wird gerendert`,
    ...(scheduled
      ? [`„approve schedule“ → Publora plant TikTok ${esc(v.date)} ${esc(plan.defaults.videoTime)}`, `Instagram Reel manuell posten (IG-Caption unten, Cover = <code>cover.png</code>)`]
      : [`TikTok manuell posten ${esc(plan.defaults.videoTime)} · Cover = erster Frame · Produkt-Sticker nur wenn TikTok-Shop-Bestand da`, `Instagram Reel posten (IG-Caption unten, Cover = <code>cover.png</code>)`]),
    ...(ai ? ["⚠️ KI-Label setzen: „AI-generated content“ (eigene KI-Clips im Video)"] : []),
    "First Comment direkt nach dem Posten + anpinnen",
    "Nach 1 h: Kommentare beantworten (Vorlagen unten)",
  ];
  return `
<section class="card" id="${v.id}">
  <header onclick="toggleCard(this)">
    <div class="num">${n}</div>
    <div class="info"><div class="name">${esc(day(v.date))} · ${esc(v.id)} — ${esc(v.title)}</div><div class="sub">${esc(v.hook.join(" "))}</div></div>
    <div class="badges">
      <span class="badge ${v.line}">${v.line === "footage" ? "🎬 Footage" : "✨ Motion"}</span>
      <span class="badge ${scheduled ? "sched" : "manual"}">${scheduled ? "📅 Publora" : "✋ Manuell"}</span>
      ${ai ? '<span class="badge ai">KI-Label</span>' : ""}
      <span class="badge time">${esc(plan.defaults.videoTime)}</span>
    </div>
  </header>
  <div class="body">
    <div class="facts"><div><label>Post</label>${esc(plan.defaults.videoTime)}</div><div><label>Länge</label>~${seconds(v)} Sek</div><div><label>Format</label>9:16 · 1080×1920</div><div><label>Ordner</label><code>${folder(v)}</code></div></div>
    <div class="block why"><b>Warum:</b> ${esc(v.why)}</div>
    <h4>🖼️ Cover = erster Frame</h4>
    <div class="block"><b>Cover-Text (A):</b> ${esc(v.hook.join(" "))} &nbsp;·&nbsp; <b>A/B-Alternative (B):</b> ${esc(v.hookAlt.join(" "))}<br><small>Das Video startet mit dem fertigen Hook — kein separates Cover-Bild nötig. <code>cover.png</code> liegt für Instagram im Ordner.</small></div>
    <h4>🎞️ Ablauf</h4>
    <table><thead><tr><th>#</th><th>Text im Video</th><th>Bild</th><th>Voiceover</th></tr></thead><tbody>${beatRows(v)}</tbody></table>
    <h4>🎤 ElevenLabs-Skript</h4>
    <div class="block"><b>Stimme:</b> ${esc(plan.defaults.voice)}. Die <code>&lt;break&gt;</code>-Tags nicht löschen — daran wird das Audio automatisch geschnitten.</div>
    ${copy(voScript(v))}
    ${pexels.length ? `<h4>🔎 Pexels-Suche (Claude wählt die Clips)</h4><div class="block">${pexels.map((q) => `„${esc(q)}“`).join(" · ")}</div>` : ""}
    <h4>📱 TikTok-Caption</h4>
    ${copy(`${v.caption}\n\n${[...v.hashtags, ...plan.defaults.baseTags].join(" ")}`)}
    <h4>📌 First Comment</h4>
    ${copy(v.firstComment)}
    <h4>📷 Instagram-Caption</h4>
    ${copy(`${v.igCaption}\n\n${[...v.hashtags, ...(plan.defaults.igTags ?? [])].join(" ").toLowerCase()}`)}
    <h4>💬 Antwort-Vorlagen</h4>
    <ul class="replies">${v.replies.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
    <h4>📋 Checkliste</h4>
    ${checklist(steps)}
  </div>
</section>`;
}

function carouselCard(c, n) {
  const slides = c.slides.map((s, i) => {
    const [head, sub] = s.split(" | ");
    return `<li><span class="sn">${i + 1}</span><b>${esc(head)}</b>${sub ? ` — ${esc(sub)}` : ""}</li>`;
  });
  return `
<section class="card carousel" id="${c.id}">
  <header onclick="toggleCard(this)">
    <div class="num c">${n}</div>
    <div class="info"><div class="name">${esc(day(c.date))} · ${esc(c.id)} — ${esc(c.title)}</div><div class="sub">${c.slides.length} Slides · 4:5</div></div>
    <div class="badges"><span class="badge carousel">🖼️ Karussell</span><span class="badge manual">✋ Manuell</span><span class="badge time">${esc(plan.defaults.carouselTime)}</span></div>
  </header>
  <div class="body">
    <div class="facts"><div><label>Post</label>${esc(plan.defaults.carouselTime)}</div><div><label>Format</label>4:5 · 1080×1350</div><div><label>Ordner</label><code>${folder(c)}</code></div></div>
    <h4>🖼️ Slides</h4>
    <ol class="slides">${slides.join("")}</ol>
    <h4>📱 Caption (TikTok + Instagram)</h4>
    ${copy(`${c.caption}\n\n${c.hashtags.join(" ")}`)}
    <h4>📋 Checkliste</h4>
    ${checklist([`Slides prüfen: <code>${folder(c)}slide-1.png</code> …`, "TikTok: Foto-Modus, Musik leise dazu", "Instagram: Karussell posten", "Nach 1 h: Kommentare beantworten"])}
  </div>
</section>`;
}

function weekSection(w, items) {
  const cards = items
    .map(({ kind, item }) => (kind === "video" ? videoCard(item, item.id.slice(1)) : carouselCard(item, item.id.slice(1))))
    .join("");
  return `<h2 class="week">${esc(w.label)} · ${esc(day(w.from))} – ${esc(day(w.to))} <span>Freigabe bis ${esc(day(w.approveBy))}</span></h2>${cards}`;
}

const all = [...plan.videos.map((item) => ({ kind: "video", item })), ...plan.carousels.map((item) => ({ kind: "carousel", item }))].sort(
  (a, b) => a.item.date.localeCompare(b.item.date) || (a.kind === "carousel" ? -1 : 1),
);
const weeks = plan.weeks.map((w) => weekSection(w, all.filter(({ item }) => item.date >= w.from && item.date <= w.to))).join("");
const nFoot = plan.videos.filter((v) => v.line === "footage").length;
const nMotion = plan.videos.length - nFoot;
const nPublora = plan.videos.filter((v) => v.posting === "publora").length;

const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Content ${esc(plan.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;500;700&display=swap" rel="stylesheet">
<style>
:root{--gold:#D0B681;--dark:#050709;--navy:#13272F;--teal:#3F7285;--cream:#FAFAF7;--line:#E6E1D6;--text:#16181B;--muted:#6B6F76;--green:#2E9E5B;--orange:#D9822B;--purple:#7D5BD0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Outfit,system-ui,sans-serif;background:var(--cream);color:var(--text);line-height:1.5}
.top{background:var(--dark);color:#fff;padding:18px 24px;border-bottom:3px solid var(--gold);position:sticky;top:0;z-index:10;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
.top .logo{font-size:1.4rem}.top .logo b{font-weight:700}.top .logo span{font-weight:300}.top .meta{color:#ffffff88;font-size:.85rem}
.progress{height:6px;background:#ffffff22;border-radius:3px;flex:1;min-width:160px;max-width:360px;overflow:hidden}.progress i{display:block;height:100%;background:var(--gold);width:0}
main{max-width:960px;margin:0 auto;padding:28px 16px 80px}
.intro{background:#fff;border:1px solid var(--line);border-radius:16px;padding:24px;margin-bottom:28px}
.intro h1{font-size:1.5rem;margin-bottom:6px}.intro p{color:var(--muted);margin-bottom:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:16px 0}
.grid div{background:var(--cream);border-radius:12px;padding:14px}.grid b{display:block;font-size:1.6rem;color:var(--navy)}
.intro ul{padding-left:20px;margin:6px 0 14px}.intro li{margin:4px 0}
h2.week{font-size:1.1rem;margin:36px 0 14px;padding-bottom:8px;border-bottom:2px solid var(--gold);display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
h2.week span{font-weight:500;font-size:.85rem;color:var(--muted)}
.card{background:#fff;border:1px solid var(--line);border-radius:16px;margin-bottom:16px;overflow:hidden}
.card header{display:flex;gap:14px;align-items:center;padding:16px 20px;background:var(--dark);cursor:pointer}
.card.carousel header{background:var(--navy)}
.num{width:42px;height:42px;border-radius:50%;background:var(--gold);color:var(--dark);font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.num.c{background:var(--teal);color:#fff}.card.done .num{background:var(--green);color:#fff}
.info{flex:1;min-width:0}.name{color:#fff;font-weight:700}.sub{color:#ffffff88;font-size:.85rem}
.badges{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.badge{font-size:.72rem;font-weight:600;padding:3px 10px;border-radius:99px;border:1px solid #ffffff33;color:#fff;white-space:nowrap}
.badge.footage{border-color:var(--orange);color:#F2B36B}.badge.motion{border-color:var(--gold);color:var(--gold)}.badge.sched{border-color:var(--green);color:#7FD6A3}
.badge.manual{color:#ffffffaa}.badge.ai{border-color:var(--purple);color:#B9A4F0}.badge.carousel{border-color:var(--teal);color:#9CC7D6}
.body{display:none;padding:22px}.card.open .body{display:block}
h4{font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:var(--teal);margin:22px 0 8px}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.facts div{background:var(--cream);border-radius:10px;padding:10px 12px;font-weight:600;overflow-wrap:anywhere}.facts label{display:block;font-size:.7rem;color:var(--muted);font-weight:500;text-transform:uppercase;letter-spacing:.08em}
.block{background:var(--cream);border-left:3px solid var(--gold);border-radius:8px;padding:12px 14px}.block.why{margin-top:14px;border-color:var(--orange)}
table{width:100%;border-collapse:collapse;font-size:.9rem}th,td{text-align:left;padding:8px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:.72rem;color:var(--muted);text-transform:uppercase}
.gold{color:#A88A4A;font-weight:700}.note{color:var(--muted);font-size:.8rem}.rows{font-size:.8rem;margin-top:4px}
code{font-size:.8rem;background:#EFEBE2;padding:1px 5px;border-radius:4px;overflow-wrap:anywhere}
.copy{position:relative;background:var(--dark);border-radius:10px;padding:14px 14px 14px;margin-top:6px}
.copy pre{color:#EDEBE6;white-space:pre-wrap;font-family:inherit;font-size:.9rem;padding-right:64px}
.copy button{position:absolute;top:10px;right:10px;background:var(--gold);border:0;border-radius:6px;padding:4px 10px;font:600 .75rem Outfit,sans-serif;cursor:pointer}
.copy button.ok{background:var(--green);color:#fff}
.replies{padding-left:20px}.replies li{margin:4px 0}
.slides{list-style:none}.slides li{padding:8px 0;border-bottom:1px solid var(--line)}.sn{display:inline-block;width:24px;height:24px;border-radius:50%;background:var(--teal);color:#fff;font-size:.75rem;text-align:center;line-height:24px;margin-right:8px}
.check{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);cursor:pointer}.check:last-child{border:0}
.box{width:20px;height:20px;border:2px solid var(--gold);border-radius:5px;flex-shrink:0;margin-top:2px}.check.on .box{background:var(--green);border-color:var(--green)}.check.on span:last-child{color:var(--muted);text-decoration:line-through}
@media (max-width:600px){.card header{flex-wrap:wrap}.badges{justify-content:flex-start;width:100%}table,thead,tbody,tr,td,th{display:block}thead{display:none}td{border:0;padding:4px 0}tr{border-bottom:1px solid var(--line);padding:8px 0}}
</style></head><body>
<div class="top"><div class="logo"><b>Vida</b><span>Pure</span> · Content ${esc(plan.title)}</div><div class="progress" title="Erledigt"><i id="bar"></i></div><div class="meta">${plan.videos.length} Videos · ${plan.carousels.length} Karussells · ${esc(plan.status)}</div></div>
<main>
<div class="intro">
<h1>Content-Plan ${esc(plan.title)}</h1>
<p>Generiert aus <code>content/${month}/plan.json</code> — Änderungen immer dort, dann neu erzeugen.</p>
<div class="grid">
<div><b>${nFoot}</b>Footage-Videos (Pexels + eigenes Material)</div>
<div><b>${nMotion}</b>Motion-Videos (reine Grafik)</div>
<div><b>${nPublora}</b>davon per Publora geplant (TikTok) · Rest manuell</div>
<div><b>${plan.carousels.length}</b>Karussells 4:5 · manuell</div>
<div><b>${esc(plan.defaults.videoTime)}</b>Videos täglich · Karussells ${esc(plan.defaults.carouselTime)}</div>
</div>
<h4>Montag = Freigabe-Tag</h4>
<ul>
<li>Claude rendert die Videos und Karussells der Woche vorab als <b>stumme Drafts</b> in <code>out/${month}/&lt;ID&gt;-&lt;slug&gt;/</code>.</li>
<li>Du schaust sie an, nimmst die Voiceovers in ElevenLabs auf (Skripte unten) und legst sie als <code>vo.mp3</code> in den jeweiligen Ordner.</li>
<li>Claude schneidet das Audio automatisch an den Pausen, rendert <code>final.mp4</code> und plant die Footage-Videos nach deinem „approve schedule“ in Publora.</li>
<li>Publora Starter: 15 Posts/Monat <b>pro Plattform</b> gezählt, max. 3 gleichzeitig geplant, max. 7 Tage im Voraus → Publora übernimmt TikTok für die ${nPublora} markierten Videos (📅, ohne eigene KI-Clips — Publora kann das KI-Label nicht setzen), Instagram postest du selbst.</li>
</ul>
<h4>Regeln</h4>
<ul>${plan.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
</div>
${weeks}
</main>
<script>
const KEY="reelsmaker-${month}";
let state={};try{state=JSON.parse(localStorage.getItem(KEY)||"{}")}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
function toggleCard(h){h.parentElement.classList.toggle("open")}
function copyBlock(b){navigator.clipboard.writeText(b.nextElementSibling.textContent).then(()=>{b.textContent="Copied!";b.classList.add("ok");setTimeout(()=>{b.textContent="Copy";b.classList.remove("ok")},1500)})}
function toggleCheck(el){el.classList.toggle("on");state[el.dataset.k]=el.classList.contains("on");save();update()}
function update(){const all=document.querySelectorAll(".check"),on=document.querySelectorAll(".check.on");document.getElementById("bar").style.width=(all.length?on.length/all.length*100:0)+"%";
document.querySelectorAll(".card").forEach(c=>{const cs=c.querySelectorAll(".check");c.classList.toggle("done",cs.length>0&&[...cs].every(x=>x.classList.contains("on")))})}
document.querySelectorAll(".card").forEach(c=>c.querySelectorAll(".check").forEach((el,i)=>{el.dataset.k=c.id+"-"+i;if(state[el.dataset.k])el.classList.add("on")}));
update();
</script>
</body></html>
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(outFile, html);
console.log(`✔ ${outFile}  (${plan.videos.length} videos, ${plan.carousels.length} carousels)`);
