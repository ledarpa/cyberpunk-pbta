#!/usr/bin/env python3
"""Genera manual.typ (Typst) desde docs/capitulos/*.md y compila los PDF.

Fuente única de verdad: los mismos .md que lee la web. Los metadatos de arte
(portraits, banners, catálogo) se importan de build_web_reader para no duplicar
el mapeo. Salida generada en docs/.generated/pdf/ (ignorado por git).
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from chapters import CHAPTER_FILES
import build_web_reader as W

ROOT = SCRIPTS.parents[1]
CAPITULOS = ROOT / "docs" / "capitulos"
PDF_DIR = ROOT / "docs" / "pdf"
OUT_DIR = ROOT / "docs" / ".generated" / "pdf"
FONTS = ROOT / "docs" / "assets" / "fonts"

GEN_ASSETS = "../.generated/pdf/assets"

def mono_png(src: Path, dst: Path) -> None:
    from PIL import Image, ImageOps

    im = Image.open(src)
    base = Image.new("RGB", im.size, (0, 0, 0))
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        rgba = im.convert("RGBA")
        base.paste(rgba, mask=rgba.split()[-1])
    else:
        base.paste(im.convert("RGB"))
    gray = ImageOps.grayscale(base)
    hist = gray.histogram()
    total = sum(hist)
    cum = 0
    vmax = 30
    for value, count in enumerate(hist):
        cum += count
        if cum >= total * 0.999:
            vmax = max(value, 30)
            break
    inv = gray.point(lambda p: max(0, min(255, 255 - int(p * 255 / vmax))))
    inv = inv.point(lambda p: 255 if p >= 250 else p)
    dst.parent.mkdir(parents=True, exist_ok=True)
    inv.save(dst)


def asset(kind: str, slug: str) -> str:
    src = ROOT / "web" / "assets" / kind / f"{slug}.png"
    if not src.exists():
        alt = ROOT / "web" / "assets" / "catalog" / f"{slug}.png"
        if kind == "manual" and alt.exists():
            src = alt
        else:
            raise FileNotFoundError(src)
    dst = OUT_DIR / "assets" / kind / f"{slug}.png"
    mono_png(src, dst)
    return f"{GEN_ASSETS}/{kind}/{slug}.png"


def asset_src(src: str) -> str:
    rel = src[len("assets/"):] if src.startswith("assets/") else src
    parts = rel.split("/")
    return asset(parts[0], parts[-1].removesuffix(".png"))

HEADING_RE = re.compile(r"^(#{1,4})\s+(.+)$")
LIST_RE = re.compile(r"^(?P<indent>[ \t]*)(?P<marker>[-*]|\d+\.)\s+(?P<body>.+)$")
TABLE_SEP_RE = re.compile(r"^\|[\s\-:|]+\|\s*$")
IMG_RE = re.compile(r"^!\[([^\]]*)\]\(([^)]+)\)$")
INLINE_SPLIT_RE = re.compile(r"(`[^`]+`|\*\*[^*]+\*\*|==[^=]+==|\*[^*]+\*)")

_ESCAPES = {
    "\\": "\\\\",
    "#": "\\#",
    "$": "\\$",
    "%": "\\%",
    "*": "\\*",
    "_": "\\_",
    "[": "\\[",
    "]": "\\]",
    "@": "\\@",
    "`": "\\`",
    "~": "\\~",
    "<": "\\<",
    "-": "\\-",
    "+": "\\+",
    "=": "\\=",
    "/": "\\/",
    ">": "\\>",
    "!": "\\!",
    '"': '\\"',
    "'": "\\'",
}


def esc(text: str) -> str:
    return "".join(_ESCAPES.get(ch, ch) for ch in text)


def inline_typ(text: str) -> str:
    out: list[str] = []
    for part in INLINE_SPLIT_RE.split(text):
        if part.startswith("`") and part.endswith("`") and len(part) >= 2:
            out.append("#mono[" + esc(part[1:-1]) + "]")
        elif part.startswith("**") and part.endswith("**") and len(part) >= 4:
            out.append("#acc[" + esc(part[2:-2]) + "]")
        elif part.startswith("==") and part.endswith("==") and len(part) >= 4:
            out.append("#hl[" + esc(part[2:-2]) + "]")
        elif part.startswith("*") and part.endswith("*") and len(part) >= 2:
            out.append("#emc[" + esc(part[1:-1]) + "]")
        elif part:
            out.append(esc(part))
    return "".join(out)


def fig_line(path: str, width: str = "100%") -> str:
    return f'#fig("{path}", width: {width})'


def convert_chapter(text: str) -> str:
    blocks: list[str] = []
    lines = text.splitlines()
    n = len(lines)
    i = 0

    table_buf: list[list[str]] = []
    quote_buf: list[str] | None = None
    pend_before: str | None = None
    pend_after: str | None = None
    list_lines: list[str] | None = None
    prev_marker: str | None = None

    def flush_quote() -> None:
        nonlocal quote_buf
        if quote_buf is None:
            return
        is_ejemplo = bool(quote_buf) and quote_buf[0].startswith("**Ejemplo")
        body_lines = quote_buf[1:] if is_ejemplo else quote_buf
        quote_buf = None
        paras = [inline_typ(q) for q in body_lines if q]
        if not paras:
            return
        body = "\n\n".join(paras)
        blocks.append(f"#ejemplo[{body}]" if is_ejemplo else f"#quote[{body}]")

    def flush_table() -> None:
        nonlocal table_buf, pend_before, pend_after
        if not table_buf:
            return
        if pend_before:
            blocks.append(fig_line(pend_before))
            pend_before = None
        head = [inline_typ(cell) for cell in table_buf[0]]
        rows = []
        for row in table_buf[1:]:
            cells = [inline_typ(cell) for cell in row]
            rows.append("(" + ", ".join(f"[{cell}]" for cell in cells) + ")")
        blocks.append(
            "#tbl((" + ", ".join(f"[{h}]" for h in head) + "), (" + ", ".join(rows) + "))"
        )
        table_buf = []
        if pend_after:
            blocks.append(fig_line(pend_after))
            pend_after = None

    def close_list() -> None:
        nonlocal list_lines, prev_marker
        if list_lines is not None:
            blocks.append("\n".join(list_lines))
            list_lines = None
        prev_marker = None

    def flush_pends() -> None:
        nonlocal pend_before, pend_after
        if pend_before:
            blocks.append(fig_line(pend_before))
            pend_before = None
        if pend_after:
            blocks.append(fig_line(pend_after))
            pend_after = None

    def heading_block(level: int, title: str) -> None:
        nonlocal pend_before, pend_after
        canon = title.strip()
        blocks.append("=" * level + " " + inline_typ(title))
        manual_art = W.MANUAL_ART.get(canon)
        if manual_art:
            width = "70%" if canon in W.MANUAL_ART_SIZE else "55%"
            blocks.append(fig_line(asset("manual", manual_art), width))
        elif canon in W.MANUAL_BANNER:
            blocks.append(fig_line(asset("manual", W.MANUAL_BANNER[canon])))
        elif canon in W.MANUAL_BANNER_BEFORE_TABLE:
            pend_before = asset("manual", W.MANUAL_BANNER_BEFORE_TABLE[canon])
        elif level == 3 and canon in W.PROFESSION_PORTRAITS:
            blocks.append(fig_line(asset("professions", W.PROFESSION_PORTRAITS[canon]), "42%"))
        elif canon in W.CATALOG_BANNER:
            blocks.append(fig_line(asset("catalog", W.CATALOG_BANNER[canon])))
        elif canon in W.CATALOG_BANNER_AFTER_TABLE:
            pend_after = asset("catalog", W.CATALOG_BANNER_AFTER_TABLE[canon])
        elif canon in W.CATALOG_ART:
            arts = W.CATALOG_ART[canon]
            if len(arts) == 1:
                blocks.append(fig_line(asset("catalog", arts[0]), "42%"))
            else:
                paths = ", ".join(f'"{asset("catalog", s)}"' for s in arts)
                width = "40%" if len(arts) == 2 else "31%"
                blocks.append(f"#figrow(({paths}), width: {width})")

    while i < n:
        raw = lines[i]
        stripped = raw.strip()
        if not (stripped.startswith("> ") or stripped == ">"):
            flush_quote()

        if stripped.startswith("|") and "|" in stripped[1:]:
            close_list()
            if not TABLE_SEP_RE.match(stripped):
                table_buf.append([cell.strip() for cell in stripped.strip("|").split("|")])
            i += 1
            continue
        flush_table()

        if not stripped:
            close_list()
            i += 1
            continue

        if stripped == "---":
            close_list()
            flush_pends()
            blocks.append("#sep()")
            i += 1
            continue

        m = HEADING_RE.match(stripped)
        if m:
            close_list()
            flush_pends()
            heading_block(len(m.group(1)), m.group(2))
            i += 1
            continue

        m = IMG_RE.match(stripped)
        if m:
            close_list()
            flush_pends()
            src = m.group(2).strip()
            blocks.append(fig_line(asset_src(src)))
            i += 1
            continue

        if stripped.startswith("> ") or stripped == ">":
            close_list()
            content = stripped[2:].strip() if stripped.startswith("> ") else ""
            if quote_buf is None:
                quote_buf = []
            quote_buf.append(content)
            i += 1
            continue

        if stripped.startswith(("**En la mesa:**", "En la mesa:", "**At the table:**", "At the table:")):
            close_list()
            flush_pends()
            blocks.append("#mesa[" + inline_typ(stripped) + "]")
            i += 1
            continue

        m = LIST_RE.match(raw)
        if m:
            indent = m.group("indent").expandtabs(2)
            level = 0
            if indent:
                level = min(2, max(1, len(indent) // 2))
            ordered = m.group("marker").endswith(".")
            marker = "+" if ordered else "-"
            if list_lines is None:
                list_lines = []
            elif marker != prev_marker:
                blocks.append("\n".join(list_lines))
                list_lines = []
            prefix = "  " * level
            list_lines.append(f"{prefix}{marker} " + inline_typ(m.group("body").strip()))
            prev_marker = marker
            i += 1
            continue

        if stripped.startswith(("Cyberpunk-PbtA", "This work is licensed")):
            close_list()
            flush_pends()
            blocks.append("#legal[" + inline_typ(stripped) + "]")
            i += 1
            continue

        close_list()
        flush_pends()
        blocks.append(inline_typ(stripped))
        i += 1

    flush_table()
    close_list()
    flush_quote()
    flush_pends()
    return "\n\n".join(blocks)


def typst_base() -> list[str]:
    return ["typst", "compile", "--root", str(ROOT), "--font-path", str(FONTS)]


def run(cmd: list[str]) -> bool:
    proc = subprocess.run(cmd, capture_output=True, text=True)
    output = (proc.stdout + proc.stderr).strip()
    if output:
        print(output)
    return proc.returncode == 0


def build_manual_typ() -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    parts = [
        '#import "../../pdf/theme.typ": *\n#show: manual',
    ]
    for name in CHAPTER_FILES:
        text = (CAPITULOS / name).read_text(encoding="utf-8")
        text = re.sub(r"^> \*\*Borrador.*$\n?", "", text, flags=re.M)
        parts.append("#chapter-block[\n" + convert_chapter(text) + "\n]")
    typ_path = OUT_DIR / "manual.typ"
    typ_path.write_text("\n\n".join(parts) + "\n", encoding="utf-8")
    return typ_path


def main() -> int:
    asset("manual", "night_city")
    typ_path = build_manual_typ()

    ok = run(typst_base() + [str(typ_path), str(PDF_DIR / "manual-es.pdf")])
    ok_ficha = run(typst_base() + [str(PDF_DIR / "ficha.typ"), str(PDF_DIR / "ficha.pdf")])
    if not (ok and ok_ficha):
        return 1
    print(f"OK {PDF_DIR / 'manual-es.pdf'}")
    print(f"OK {PDF_DIR / 'ficha.pdf'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
