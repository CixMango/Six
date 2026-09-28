"""Draws the installers' artwork from the brand images in web/public/brand.

  py -3.12 web/installer/make-art.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
BRAND = HERE.parent / "public" / "brand"
TOP = (17, 22, 32)
BOTTOM = (8, 10, 15)


def backdrop(w, h):
    img = Image.new("RGB", (w, h))
    draw = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(1, h - 1)
        draw.line([(0, y), (w, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM)))
    return img


def mark(size):
    return Image.open(BRAND / "six-512.png").convert("RGBA").resize((size, size), Image.LANCZOS)


def wordmark(width):
    # The "SIX" letters from the logo (right part, trimmed to the ink).
    logo = Image.open(BRAND / "six-logo.png").convert("RGBA")
    letters = logo.crop((logo.width * 44 // 100, 0, logo.width, logo.height))
    letters = letters.crop(letters.getbbox())
    return letters.resize((width, round(letters.height * width / letters.width)), Image.LANCZOS)


def side_panel(w, h):
    """Inno Setup's tall image on the Welcome and Finish pages."""
    img = backdrop(w, h).convert("RGBA")
    m = mark(round(w * 0.62))
    img.alpha_composite(m, ((w - m.width) // 2, round(h * 0.2)))
    word = wordmark(round(w * 0.5))
    img.alpha_composite(word, ((w - word.width) // 2, round(h * 0.2) + m.height + round(h * 0.05)))
    return img.convert("RGB")


def small(w, h):
    """Inno Setup's small image at the top right of the other pages."""
    img = backdrop(w, h).convert("RGBA")
    m = mark(round(min(w, h) * 0.9))
    img.alpha_composite(m, ((w - m.width) // 2, (h - m.height) // 2))
    return img.convert("RGB")


def mac_background(w, h):
    """The macOS installer's background: the mark in the lower left, where the text doesn't reach."""
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    m = mark(round(h * 0.34))
    img.alpha_composite(m, (round(w * 0.04), h - m.height - round(h * 0.05)))
    return img


def main():
    out = HERE / "art"
    out.mkdir(exist_ok=True)
    # Inno Setup picks the size that fits the screen's scaling.
    for scale, (w, h) in {100: (164, 314), 150: (246, 459), 200: (328, 628)}.items():
        side_panel(w, h).save(out / f"wizard-{scale}.bmp")
    for scale, (w, h) in {100: (55, 58), 150: (83, 87), 200: (110, 116)}.items():
        small(w, h).save(out / f"wizard-small-{scale}.bmp")
    mac_background(620, 418).save(out / "mac-background.png")
    print("wrote", ", ".join(sorted(p.name for p in out.iterdir())))


if __name__ == "__main__":
    main()
