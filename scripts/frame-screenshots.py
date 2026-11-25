# -*- coding: utf-8 -*-
"""为 README 预览图烘焙圆角描边（GitHub 会剥离 img 的 style）。"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

SCREENSHOT = Path(__file__).resolve().parent.parent / "screenshot"
BORDER = 2
RADIUS = 14
PAD = 10
STROKE = (216, 220, 228, 255)
BG = (255, 255, 255, 255)


def frame_image(path: Path) -> None:
    src = Image.open(path).convert("RGBA")
    w, h = src.size
    inset = BORDER + PAD
    cw, ch = w + 2 * inset, h + 2 * inset
    out = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    draw = ImageDraw.Draw(out)
    draw.rounded_rectangle(
        [0, 0, cw - 1, ch - 1],
        radius=RADIUS,
        fill=BG,
        outline=STROKE,
        width=BORDER,
    )
    out.paste(src, (inset, inset), src)
    rgb = Image.new("RGB", out.size, (255, 255, 255))
    rgb.paste(out, mask=out.split()[3])
    rgb.save(path, "PNG", optimize=True)
    print(f"framed {path.name} {w}x{h} -> {cw}x{ch}")


def main() -> None:
    for path in sorted(SCREENSHOT.glob("vibe-design-lite-*.png")):
        if "副本" in path.name or "copy" in path.name.lower():
            continue
        frame_image(path)


if __name__ == "__main__":
    main()