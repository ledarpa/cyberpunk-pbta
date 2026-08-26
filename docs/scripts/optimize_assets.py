#!/usr/bin/env python3
"""Comprime imágenes en web/assets/ (PNG + JPEG disfrazados de .png)."""

from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from io import BytesIO
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "web" / "assets"
PNGQUANT = shutil.which("pngquant")
OXIPNG = shutil.which("oxipng")

JPEG_QUALITY = 82
PNGQUANT_QUALITY = "65-85"


def human(n: int) -> str:
    if n >= 1024 * 1024:
        return f"{n / 1024 / 1024:.2f} MB"
    return f"{n / 1024:.1f} KB"


def is_jpeg_payload(path: Path) -> bool:
    with path.open("rb") as fh:
        head = fh.read(3)
    return head[:2] == b"\xff\xd8"


def optimize_jpeg(path: Path) -> tuple[int, int]:
    before = path.stat().st_size
    with Image.open(path) as im:
        im = im.convert("RGB")
        buf = BytesIO()
        im.save(buf, format="JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
        data = buf.getvalue()
    if len(data) >= before:
        return before, before
    path.write_bytes(data)
    return before, len(data)


def optimize_png(path: Path) -> tuple[int, int]:
    before = path.stat().st_size
    if not PNGQUANT or not OXIPNG:
        with Image.open(path) as im:
            tmp = path.with_suffix(".opt.png")
            im.save(tmp, format="PNG", optimize=True)
            after = tmp.stat().st_size
            if after < before:
                tmp.replace(path)
                return before, after
            tmp.unlink(missing_ok=True)
            return before, before

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = Path(tmp.name)
    try:
        cmd = [
            PNGQUANT,
            f"--quality={PNGQUANT_QUALITY}",
            "--skip-if-larger",
            "--force",
            "--output",
            str(tmp_path),
            str(path),
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        if proc.returncode not in (0, 99):
            return before, before
        if not tmp_path.exists() or tmp_path.stat().st_size == 0:
            return before, before
        tmp_path.replace(path)
        subprocess.run([OXIPNG, "-o4", "-strip", str(path)], check=False, capture_output=True)
        after = path.stat().st_size
        if after >= before:
            return before, before
        return before, after
    finally:
        tmp_path.unlink(missing_ok=True)


def optimize_file(path: Path) -> tuple[int, int] | None:
    if path.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
        return None
    try:
        if path.suffix.lower() in {".jpg", ".jpeg"} or is_jpeg_payload(path):
            return optimize_jpeg(path)
        return optimize_png(path)
    except OSError as err:
        print(f"SKIP {path.relative_to(ROOT)} ({err})", file=sys.stderr)
        return None


def main() -> int:
    files = sorted(
        p
        for p in ASSETS.rglob("*")
        if p.is_file() and p.suffix.lower() in {".png", ".jpg", ".jpeg"}
    )
    if not files:
        print("No images found.")
        return 0

    total_before = 0
    total_after = 0
    changed = 0

    print(f"Optimizing {len(files)} images in {ASSETS.relative_to(ROOT)}")
    if PNGQUANT and OXIPNG:
        print(f"PNG: pngquant ({PNGQUANT_QUALITY}) + oxipng")
    else:
        print("PNG: Pillow (install pngquant + oxipng for better results)")
    print(f"JPEG: quality {JPEG_QUALITY}")

    for path in files:
        result = optimize_file(path)
        if not result:
            continue
        before, after = result
        total_before += before
        total_after += after
        rel = path.relative_to(ROOT)
        if after < before:
            changed += 1
            pct = (1 - after / before) * 100
            print(f"  {rel}: {human(before)} → {human(after)} (−{pct:.0f}%)")
        else:
            print(f"  {rel}: {human(before)} (sin cambio)")

    saved = total_before - total_after
    pct = (saved / total_before * 100) if total_before else 0
    print(
        f"\nOK {changed}/{len(files)} optimized · "
        f"{human(total_before)} → {human(total_after)} (−{human(saved)}, −{pct:.1f}%)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
