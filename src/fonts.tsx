import React from "react";
import { FONT_FACE_CSS } from "./fonts.generated";

// Renders the embedded @font-face CSS. Mount once, as the first child of the
// composition root — no delayRender, no fetch, nothing to race. See
// scripts/generate-fonts.mjs for why fonts are base64-embedded.
export const GlobalFonts: React.FC = () => <style dangerouslySetInnerHTML={{ __html: FONT_FACE_CSS }} />;
