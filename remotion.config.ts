import { Config } from "@remotion/cli/config";

// JPEG frames are faster to encode than PNG and visually identical for
// opaque, full-bleed video like this.
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
