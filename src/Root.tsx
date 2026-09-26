// Composition registry. You should not need to edit this file to make a new
// reel — write a script JSON and run `npm run reelsmaker -- --script=...`,
// which renders the "ReelsMaker" composition with { reel: <your script> } as --props.

import React from "react";
import { Composition } from "remotion";
import demoClassic from "../scripts/reelsmaker/demo-classic.json";
import demoContrast from "../scripts/reelsmaker/demo-contrast.json";
import liftForLater from "../scripts/reelsmaker/lift-for-later.json";
import { REEL_DURATION, REEL_FPS, REEL_HEIGHT, REEL_WIDTH } from "./beats";
import { resolveScript } from "./brands";
import { ContactSheet, SHEET_HEIGHT, SHEET_WIDTH } from "./ContactSheet";
import { Reel, ReelEntry } from "./Reel";

const liftForLaterProps = resolveScript(liftForLater, "lift-for-later.json");
const demoClassicProps = resolveScript(demoClassic, "demo-classic.json");
const demoContrastProps = resolveScript(demoContrast, "demo-contrast.json");

// Instagram Reels/Stories spec, applied to every reel composition.
const REEL_SPEC = { durationInFrames: REEL_DURATION, fps: REEL_FPS, width: REEL_WIDTH, height: REEL_HEIGHT } as const;

export const RemotionRoot: React.FC = () => (
  <>
    {/* The ReelsMaker target — the CLI renders this with --props=<your script>. */}
    <Composition id="ReelsMaker" component={ReelEntry} {...REEL_SPEC} defaultProps={{ reel: liftForLaterProps }} />
    <Composition
      id="ReelsMakerContactSheet"
      component={ContactSheet}
      durationInFrames={REEL_DURATION}
      fps={REEL_FPS}
      width={SHEET_WIDTH}
      height={SHEET_HEIGHT}
      defaultProps={{ reel: liftForLaterProps }}
    />

    {/* Bundled examples, for browsing in Studio. */}
    <Composition id="LiftForLater" component={Reel} {...REEL_SPEC} defaultProps={liftForLaterProps} />
    <Composition id="DemoClassic" component={Reel} {...REEL_SPEC} defaultProps={demoClassicProps} />
    <Composition id="DemoContrast" component={Reel} {...REEL_SPEC} defaultProps={demoContrastProps} />
  </>
);
