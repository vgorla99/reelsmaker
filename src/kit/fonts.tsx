import React from "react";
import { FONT_FACE_CSS } from "./fonts.generated";

// Base64-embedded @font-face (no render-time fetch, nothing to race).
// Regenerate src/fonts.generated.ts with `npm run fonts`.
export const GlobalFonts: React.FC = () => <style dangerouslySetInnerHTML={{ __html: FONT_FACE_CSS }} />;
