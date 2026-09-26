// Runtime validation for brands and scripts. Used by the ReelsMaker CLI
// (before rendering) and by Root.tsx (for the bundled example scripts), so a
// typo in a JSON script fails fast with a readable message instead of
// rendering a broken reel. JSX-free and runtime-import-free on purpose.

import type {
  BrandConfig,
  HookTypeVariant,
  MorphPath,
  PointAVariant,
  PointBVariant,
  ProblemTypeVariant,
  ReelContent,
  ReelProps,
  WordTiming,
} from "./types.ts";

export type ValidationResult<T> = { ok: true; value: T; warnings: string[] } | { ok: false; errors: string[]; warnings: string[] };

type Obj = Record<string, unknown>;

const HEX = /^#[0-9a-fA-F]{6}$/;

// Soft copy-length limits — beyond these the text still renders, but wraps
// into more lines than the beat has time/space for. Warnings, not errors.
const MAX_HOOK_LINE_CHARS = 24;
const MAX_PROBLEM_CHARS = 170;
const MAX_BODY_CHARS = 110;

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

class Reader {
  readonly errors: string[] = [];
  readonly warnings: string[] = [];
  private readonly obj: Obj;
  private readonly path: string;

  constructor(obj: Obj, path: string) {
    this.obj = obj;
    this.path = path;
  }

  private at(key: string): string {
    return this.path ? `${this.path}.${key}` : key;
  }

  // Non-empty string.
  str(key: string): string {
    const v = this.obj[key];
    if (typeof v !== "string" || v.trim() === "") {
      this.errors.push(`${this.at(key)}: expected a non-empty string`);
      return "";
    }
    return v;
  }

  // Any string, including "" (e.g. a unit-less suffix).
  anyStr(key: string): string {
    const v = this.obj[key];
    if (typeof v !== "string") {
      this.errors.push(`${this.at(key)}: expected a string (use "" for none)`);
      return "";
    }
    return v;
  }

  optStr(key: string): string | undefined {
    const v = this.obj[key];
    if (v === undefined) return undefined;
    if (typeof v !== "string") {
      this.errors.push(`${this.at(key)}: expected a string`);
      return undefined;
    }
    return v;
  }

  hex(key: string): string {
    const v = this.str(key);
    if (v && !HEX.test(v)) this.errors.push(`${this.at(key)}: expected a #rrggbb hex color, got "${v}"`);
    return v;
  }

  num(key: string, min = -Infinity, max = Infinity): number {
    const v = this.obj[key];
    if (typeof v !== "number" || !Number.isFinite(v)) {
      this.errors.push(`${this.at(key)}: expected a number`);
      return 0;
    }
    if (v < min || v > max) this.errors.push(`${this.at(key)}: expected ${min}..${max}, got ${v}`);
    return v;
  }

  optNum(key: string, min = -Infinity, max = Infinity): number | undefined {
    if (this.obj[key] === undefined) return undefined;
    return this.num(key, min, max);
  }

  oneOf<T extends string>(key: string, allowed: readonly T[]): T | undefined {
    const v = this.obj[key];
    if (v === undefined) return undefined;
    const match = allowed.find((a) => a === v);
    if (match === undefined) {
      this.errors.push(`${this.at(key)}: expected one of ${allowed.map((a) => `"${a}"`).join(", ")}, got ${JSON.stringify(v)}`);
    }
    return match;
  }

  timings(key: string): WordTiming[] | undefined {
    const v = this.obj[key];
    if (v === undefined) return undefined;
    if (!Array.isArray(v)) {
      this.errors.push(`${this.at(key)}: expected an array of { startFrame: number }`);
      return undefined;
    }
    const out: WordTiming[] = [];
    v.forEach((t: unknown, i) => {
      if (isObj(t) && typeof t.startFrame === "number" && Number.isFinite(t.startFrame)) {
        out.push({ startFrame: t.startFrame });
      } else {
        this.errors.push(`${this.at(key)}[${i}]: expected { startFrame: number }`);
      }
    });
    return out;
  }

  // Requires `key` only when the chosen variant needs it.
  requireFor(variantActive: boolean, key: string, variantDesc: string): void {
    if (variantActive && this.obj[key] === undefined) {
      this.errors.push(`${this.at(key)}: required when ${variantDesc}`);
    }
  }
}

export function validateBrand(raw: unknown, path = "brand"): ValidationResult<BrandConfig> {
  if (!isObj(raw)) return { ok: false, errors: [`${path}: expected an object`], warnings: [] };
  const r = new Reader(raw, path);
  const name = r.str("name");
  const handle = r.str("handle");

  const markRaw = raw.shortMark;
  const colorsRaw = raw.colors;
  const fontsRaw = raw.fonts;
  if (!isObj(markRaw)) r.errors.push(`${path}.shortMark: expected { prefix, suffix }`);
  if (!isObj(colorsRaw)) r.errors.push(`${path}.colors: expected an object`);
  if (!isObj(fontsRaw)) r.errors.push(`${path}.fonts: expected { headline, body }`);
  if (!isObj(markRaw) || !isObj(colorsRaw) || !isObj(fontsRaw)) {
    return { ok: false, errors: r.errors, warnings: r.warnings };
  }

  const mark = new Reader(markRaw, `${path}.shortMark`);
  const colors = new Reader(colorsRaw, `${path}.colors`);
  const fonts = new Reader(fontsRaw, `${path}.fonts`);

  const accentsRaw = colorsRaw.accents;
  let accents: [string, string, string] = ["", "", ""];
  if (Array.isArray(accentsRaw) && accentsRaw.length === 3 && accentsRaw.every((a) => typeof a === "string" && HEX.test(a))) {
    accents = [String(accentsRaw[0]), String(accentsRaw[1]), String(accentsRaw[2])];
  } else {
    colors.errors.push(`${path}.colors.accents: expected exactly 3 #rrggbb hex colors`);
  }

  const brand: BrandConfig = {
    name,
    handle,
    shortMark: { prefix: mark.str("prefix"), suffix: mark.optStr("suffix") ?? "" },
    colors: {
      bg: colors.hex("bg"),
      ink: colors.hex("ink"),
      body: colors.hex("body"),
      faint: colors.hex("faint"),
      line: colors.hex("line"),
      card: colors.hex("card"),
      accents,
    },
    fonts: { headline: fonts.str("headline"), body: fonts.str("body") },
  };

  const errors = [...r.errors, ...mark.errors, ...colors.errors, ...fonts.errors];
  return errors.length ? { ok: false, errors, warnings: r.warnings } : { ok: true, value: brand, warnings: r.warnings };
}

// Removes keys whose value is undefined, so optional variant fields that
// weren't set behave exactly like "field absent".
function withoutUndefined<T extends object>(obj: T): T {
  const out = { ...obj };
  for (const key of Object.keys(out) as (keyof T)[]) {
    if (out[key] === undefined) delete out[key];
  }
  return out;
}

export function validateContent(raw: unknown): ValidationResult<ReelContent> {
  if (!isObj(raw)) return { ok: false, errors: ["script: expected a JSON object"], warnings: [] };
  const r = new Reader(raw, "");

  const pointAVariant = r.oneOf<PointAVariant>("pointAVariant", ["radial", "seesaw"]);
  const pointBVariant = r.oneOf<PointBVariant>("pointBVariant", ["bar", "orbit"]);
  const isSeesaw = pointAVariant === "seesaw";
  const isOrbit = pointBVariant === "orbit";

  r.requireFor(!isSeesaw, "pointAStatLabel", 'pointAVariant is "radial" (the default)');
  r.requireFor(!isSeesaw, "pointAStatTo", 'pointAVariant is "radial" (the default)');
  r.requireFor(isSeesaw, "pointALeftLabel", 'pointAVariant is "seesaw"');
  r.requireFor(isSeesaw, "pointARightLabel", 'pointAVariant is "seesaw"');
  for (const k of ["pointBBeforeLabel", "pointBBeforeValue", "pointBAfterLabel", "pointBAfterValue"]) {
    r.requireFor(!isOrbit, k, 'pointBVariant is "bar" (the default)');
  }
  r.requireFor(isOrbit, "pointBStatLabel", 'pointBVariant is "orbit"');
  r.requireFor(isOrbit, "pointBStatTo", 'pointBVariant is "orbit"');

  const content = withoutUndefined<ReelContent>({
    kicker: r.str("kicker"),
    hook: r.str("hook"),
    hookTypeVariant: r.oneOf<HookTypeVariant>("hookTypeVariant", ["kinetic", "buildup"]),
    problemLine: r.str("problemLine"),
    problemTypeVariant: r.oneOf<ProblemTypeVariant>("problemTypeVariant", ["stagger", "buildup"]),

    pointATitle: r.str("pointATitle"),
    pointABody: r.str("pointABody"),
    pointAVariant,
    pointAStatLabel: r.optStr("pointAStatLabel"),
    pointAStatFrom: r.optNum("pointAStatFrom", 0, 100),
    pointAStatTo: r.optNum("pointAStatTo", 0, 100),
    pointALeftLabel: r.optStr("pointALeftLabel"),
    pointARightLabel: r.optStr("pointARightLabel"),

    pointBTitle: r.str("pointBTitle"),
    pointBBody: r.str("pointBBody"),
    pointBVariant,
    pointBBeforeLabel: r.optStr("pointBBeforeLabel"),
    pointBBeforeValue: r.optNum("pointBBeforeValue", 0),
    pointBAfterLabel: r.optStr("pointBAfterLabel"),
    pointBAfterValue: r.optNum("pointBAfterValue", 0),
    pointBUnit: r.optStr("pointBUnit"),
    pointBStatLabel: r.optStr("pointBStatLabel"),
    pointBStatTo: r.optNum("pointBStatTo", 0, 100),

    statLabel: r.str("statLabel"),
    statFrom: r.num("statFrom"),
    statTo: r.num("statTo"),
    statSuffix: r.anyStr("statSuffix"),

    ctaText: r.str("ctaText"),
    ctaSub: r.str("ctaSub"),
    morphPath: r.oneOf<MorphPath>("morphPath", ["classic", "journey"]),

    voiceoverSrc: r.optStr("voiceoverSrc"),
    musicSrc: r.optStr("musicSrc"),
    musicVolume: r.optNum("musicVolume", 0, 1),
    hookTimings: r.timings("hookTimings"),
    bodyTimings: r.timings("bodyTimings"),
  });

  // Copy-length warnings.
  content.hook.split("\n").forEach((line, i) => {
    if (line.length > MAX_HOOK_LINE_CHARS) {
      r.warnings.push(`hook line ${i + 1} is ${line.length} chars (> ${MAX_HOOK_LINE_CHARS}) — it will wrap; add a "\\n" break`);
    }
  });
  if (content.problemLine.length > MAX_PROBLEM_CHARS) {
    r.warnings.push(`problemLine is ${content.problemLine.length} chars (> ${MAX_PROBLEM_CHARS}) — may not finish revealing before the cut`);
  }
  for (const k of ["pointABody", "pointBBody"] as const) {
    if (content[k].length > MAX_BODY_CHARS) {
      r.warnings.push(`${k} is ${content[k].length} chars (> ${MAX_BODY_CHARS}) — may push the chart card off-center`);
    }
  }

  return r.errors.length ? { ok: false, errors: r.errors, warnings: r.warnings } : { ok: true, value: content, warnings: r.warnings };
}

// Validates a fully-resolved props object (brand already an object).
export function validateProps(raw: unknown): ValidationResult<ReelProps> {
  if (!isObj(raw)) return { ok: false, errors: ["props: expected an object"], warnings: [] };
  const brand = validateBrand(raw.brand);
  const content = validateContent(raw);
  const warnings = [...brand.warnings, ...content.warnings];
  if (!brand.ok || !content.ok) {
    return { ok: false, errors: [...(brand.ok ? [] : brand.errors), ...(content.ok ? [] : content.errors)], warnings };
  }
  return { ok: true, value: { ...content.value, brand: brand.value }, warnings };
}

// Throwing variant for module-load-time use (Root.tsx).
export function assertProps(raw: unknown, label: string): ReelProps {
  const res = validateProps(raw);
  if (!res.ok) throw new Error(`Invalid reel script "${label}":\n  - ${res.errors.join("\n  - ")}`);
  return res.value;
}
