// Reel registry. `npm run new -- <slug>` adds entries at the markers below.

import type { ReelEntry } from "../kit/reel";
import { reel as liftForLater } from "./lift-for-later/Reel";
// @reel-imports (keep this marker)

export const REELS: readonly ReelEntry[] = [
  liftForLater,
  // @reel-entries (keep this marker)
];
