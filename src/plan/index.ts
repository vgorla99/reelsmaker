// Planned months. Each month adds its plan + VO map here (two imports, one entry):
//
//   import m from "../../content/YYYY-MM/plan.json";
//   import v from "../../content/YYYY-MM/vo.json";
//   const MONTHS: readonly Month[] = [{ plan: m as unknown as Month["plan"], vo: v as VoMap }];
//
// JSON imports carry no literal types, so the plan is cast; fromPlan checks
// the fields that the type system can't (line, block types, titles).

import example from "../../content/example/plan.json";
import exampleVo from "../../content/example/vo.json";
import type { ReelEntry } from "../kit/reel";
import { type CarouselEntry, type PlanCarousel, carouselEntry } from "./Carousel";
import { type PlanFile, type VoMap, reelsFromPlan } from "./fromPlan";

type Month = { plan: PlanFile & { carousels: readonly PlanCarousel[] }; vo: VoMap };
// content/example: neutral demo month so a fresh clone renders. Remove it once you add a real month.
const MONTHS: readonly Month[] = [{ plan: example as unknown as Month["plan"], vo: exampleVo as VoMap }];

const built = MONTHS.map((m) => reelsFromPlan(m.plan, m.vo));

export const PLAN_REELS: readonly ReelEntry[] = built.flatMap((b) => b.reels);
export const PLAN_PENDING: readonly string[] = built.flatMap((b, i) => b.pending.map((id) => `${MONTHS[i].plan.month} ${id}`));

export const CAROUSELS: readonly CarouselEntry[] = MONTHS.flatMap((m) => m.plan.carousels.map((c) => carouselEntry(m.plan.month, c)));
