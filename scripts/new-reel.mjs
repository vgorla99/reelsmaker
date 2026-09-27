// npm run new -- <slug>
// Scaffolds src/reels/<slug>/ from src/reels/_starter and registers it in
// src/reels/index.ts. The composition id is the PascalCase slug.

import { cpSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const slug = process.argv[2];

if (!slug || !/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error("Usage: npm run new -- <slug>   (lowercase, digits, dashes — e.g. grip-strength)");
  process.exit(1);
}

const id = slug.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const camel = id[0].toLowerCase() + id.slice(1);
const reelsDir = join(root, "src", "reels");
const dest = join(reelsDir, slug);

if (existsSync(dest)) {
  console.error(`src/reels/${slug} already exists — pick another slug.`);
  process.exit(1);
}

cpSync(join(reelsDir, "_starter"), dest, { recursive: true });

const reelFile = join(dest, "Reel.tsx");
const src = readFileSync(reelFile, "utf8")
  .replace(/^\/\/ STARTER — copied by .*$/m, `// ${id} — scaffolded from _starter. Make it this video's own.`)
  .replace(/export const Starter\b/g, `export const ${id}`)
  .replace(/component: Starter\b/g, `component: ${id}`)
  .replace(/id: "Starter"/g, `id: "${id}"`);
writeFileSync(reelFile, src);

const indexFile = join(reelsDir, "index.ts");
const index = readFileSync(indexFile, "utf8");
if (!index.includes("// @reel-imports") || !index.includes("// @reel-entries")) {
  console.error("src/reels/index.ts is missing its @reel-imports / @reel-entries markers — register the reel by hand.");
  process.exit(1);
}
writeFileSync(
  indexFile,
  index
    .replace("// @reel-imports", `import { reel as ${camel} } from "./${slug}/Reel";\n// @reel-imports`)
    .replace("  // @reel-entries", `  ${camel},\n  // @reel-entries`),
);

console.log(`Created src/reels/${slug}/Reel.tsx (composition "${id}") and registered it.`);
console.log(`Next: npm start   ->  preview "${id}"`);
console.log(`      npm run reel -- ${id}   ->  out/${id}.mp4 + out/${id}-review.png`);
