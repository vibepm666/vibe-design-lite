# -*- coding: utf-8 -*-
"""为 README 预览图烘焙圆角 + 阴影（GitHub 会剥离 img 的 style）。"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

SCREENSHOT = Path(__file__).resolve().parent.parent / "screenshot"
RADIUS = 14
SHADOW_OFFSET = (0, 6)
SHADOW_BLUR = 14
SHADOW_ALPHA = 48
MARGIN = 20


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255
    )
    return mask


def frame_image(path: Path) -> None:
    src = Image.open(path).convert("RGBA")
    w, h = src.size
    mask = rounded_mask((w, h), RADIUS)

    rounded = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    rounded.paste(src, (0, 0), mask)

    shadow = Image.new("RGBA", (w, h), (17, 17, 19, SHADOW_ALPHA))
    shadow = shadow.filter(ImageFilter.GaussianBlur(SHADOW_BLUR))

    cw = w + 2 * MARGIN
    ch = h + 2 * MARGIN
    ox, oy = MARGIN + SHADOW_OFFSET[0], MARGIN + SHADOW_OFFSET[1]
    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    canvas.paste(shadow, (ox, oy), mask)
    canvas.paste(rounded, (MARGIN, MARGIN), rounded)

    flat = Image.new("RGB", canvas.size, (255, 255, 255))
    flat.paste(canvas, mask=canvas.split()[3])
    flat.save(path, "PNG", optimize=True)
    print(f"framed {path.name} {w}x{h} -> {cw}x{ch}")


def main() -> None:
    for path in sorted(SCREENSHOT.glob("vibe-design-lite-*.png")):
        if "副本" in path.name or "copy" in path.name.lower():
            continue
        frame_image(path)


if __name__ == "__main__":
    main()