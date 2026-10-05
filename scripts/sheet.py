# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow>=10"]
# ///
"""Contact sheet: one labelled row of thumbnails per asset.

Called by scripts/lib/media.mjs with a JSON spec:
  {"rows": [{"label": "own-hug-1a2b", "frames": ["a.jpg", "b.jpg"]}], "out": "sheet.jpg"}
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

THUMB_H = 300  # every thumbnail is scaled to this height
THUMB_W = 170  # ...and fitted into this width (9:16 fills it)
PER_ASSET = 3  # thumbnails per asset
COLS = 4  # assets per sheet row
PAGE = 16  # assets per sheet image
LABEL_H = 56
GAP = 10
BG = (18, 20, 24)
INK = (235, 232, 225)


def fit(im: Image.Image) -> Image.Image:
    im = im.convert("RGB")
    im.thumbnail((THUMB_W, THUMB_H))
    return im


def render(rows: list[dict], out: Path) -> None:
    cell_w = PER_ASSET * (THUMB_W + 4) + GAP
    cell_h = LABEL_H + THUMB_H + GAP
    grid_rows = (len(rows) + COLS - 1) // COLS
    sheet = Image.new("RGB", (COLS * cell_w + GAP, grid_rows * cell_h + GAP), BG)
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=17)
    for i, meta in enumerate(rows):
        x0 = GAP + (i % COLS) * cell_w
        y0 = GAP + (i // COLS) * cell_h
        label = meta["label"].split(" | ")
        draw.multiline_text((x0, y0), "\n".join(line[:62] for line in label[:2]), fill=INK, font=font, spacing=4)
        x = x0
        for p in meta["frames"][:PER_ASSET]:
            if not Path(p).exists():
                continue
            sheet.paste(fit(Image.open(p)), (x, y0 + LABEL_H))
            x += THUMB_W + 4
    sheet.save(out, quality=82)
    print(f"sheet: {out}")


def main() -> None:
    spec_path = Path(sys.argv[1])
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    rows = spec["rows"]
    if not rows:
        sys.exit("no rows")
    out = Path(spec["out"])
    pages = [rows[i : i + PAGE] for i in range(0, len(rows), PAGE)]
    for n, page in enumerate(pages, 1):
        render(page, out if len(pages) == 1 else out.with_name(f"{out.stem}-{n}{out.suffix}"))
    spec_path.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
