import React from "react";
import { Composition } from "remotion";
import { ReviewSheet, reviewSize } from "./kit/Review";
import { FPS, H, W } from "./kit/theme";
import { CAROUSELS } from "./plan";
import { CH, CW } from "./plan/Carousel";
import { REELS } from "./reels";

// Review sheets are bound per reel at module level (props must stay
// JSON-serializable, so the reel component can't be passed as a prop).
const ENTRIES = REELS.map((r) => {
  const Review: React.FC = () => <ReviewSheet Reel={r.component} frames={r.reviewFrames} fps={FPS} />;
  return { ...r, Review, reviewSize: reviewSize(r.reviewFrames.length) };
});

// Every reel: the 1080x1920 / 30fps composition itself, plus "<Id>-Review",
// a single still tiling its review frames.
export const RemotionRoot: React.FC = () => (
  <>
    {ENTRIES.map((r) => (
      <React.Fragment key={r.id}>
        <Composition id={r.id} component={r.component} durationInFrames={r.durationInFrames} fps={FPS} width={W} height={H} />
        <Composition
          id={`${r.id}-Review`}
          component={r.Review}
          durationInFrames={r.durationInFrames}
          fps={FPS}
          width={r.reviewSize.width}
          height={r.reviewSize.height}
        />
      </React.Fragment>
    ))}
    {CAROUSELS.map((c) => (
      <Composition key={c.id} id={c.id} component={c.component} durationInFrames={c.slides} fps={FPS} width={CW} height={CH} />
    ))}
  </>
);
