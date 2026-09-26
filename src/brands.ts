// Studio-side brand registry. The ReelsMaker CLI resolves `"brand": "<name>"`
// straight from brands/<name>.json on disk and does NOT need this file; it's
// only used so the bundled example scripts preview in Remotion Studio.
// To preview another brand in Studio, import its JSON and add it here.

import demo from "../brands/demo.json";
import type { ReelProps } from "./types";
import { assertProps } from "./validate";

const BRANDS: Record<string, unknown> = { demo };

// Turns a parsed script JSON (brand by name or inline) into validated props.
export function resolveScript(script: Record<string, unknown>, label: string): ReelProps {
  const ref = script.brand;
  const brand = typeof ref === "string" ? BRANDS[ref] : ref;
  if (brand === undefined) {
    throw new Error(`Script "${label}" uses brand "${String(ref)}", which isn't registered in src/brands.ts`);
  }
  return assertProps({ ...script, brand }, label);
}
