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

from chapters import CHAPTER_FILES, chapter_text
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


CATALOG_ART_AFTER_TEXT = {"Cybervértebras"}

# Ancho de fig por slug de arte del manual (default: 70%/55% según tamaño).
MANUAL_ART_WIDTH: dict[str, str] = {
    "2d6": "100%",
    "degeneracion": "100%",
    "mejora_de_atributos": "92%",
    "recuperar_humanidad": "100%",
    "ojo": "100%",
    "cyberoido": "100%",
}

# Proporciones de columnas Typst por forma de tabla: (ncols, header[0], cols).
# Primera coincidencia gana; «Aspecto» exige además fila[0] == "Qué es".
TABLE_COLS: list[tuple[int, str, str]] = [
    (3, "Código", "(5fr, 8fr, 16fr)"),
    (3, "Total", "(2fr, 3fr, 9fr)"),
    (2, "Aspecto", "(5fr, 13fr)"),
    (2, "Bonificación a la característica", "(1fr, 1fr)"),
    (2, "Casillas @Psique", "(1fr, 4fr)"),
    (2, "Calidad", "(5fr, 16fr)"),
    (2, "Módulo", "(13fr, 27fr)"),
    (2, "SAI", "(11fr, 29fr)"),
]


def table_cols_arg(table_buf: list[list[str]]) -> str:
    ncols = len(table_buf[0])
    head0 = table_buf[0][0].strip() if table_buf[0] else ""
    for n, h0, spec in TABLE_COLS:
        if ncols != n or head0 != h0:
            continue
        if h0 == "Aspecto":
            if len(table_buf) > 1 and table_buf[1][0].strip() == "Qué es":
                return ", cols: " + spec
            continue
        return ", cols: " + spec
    return ""


PROFESSION_IMG_POS = {
    "Arreglador": "title",
    "Artista": "intro",
    "Biohacker": "intro",
    "Comunicador": "example_end",
    "Corpo": "intro",
    "Espía": "intro",
    "Forastero": "example_end",
    "Mercenario": "arsenal",
    "Netrunner": "title",
}


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
    pend_prof: str | None = None
    pend_prof_pos: str | None = None
    intro_count: int = 0
    pend_after_text: str | None = None
    legal_started: bool = False

    def flush_quote() -> None:
        nonlocal quote_buf, pend_prof, pend_prof_pos
        if quote_buf is None:
            return
        is_ejemplo = bool(quote_buf) and quote_buf[0].startswith("**Ejemplo")
        body_lines = quote_buf[1:] if is_ejemplo else quote_buf
        quote_buf = None
        paras = [inline_typ(q) for q in body_lines if q]
        if not paras:
            return
        body = "\n\n".join(paras)
        if is_ejemplo and pend_prof:
            if pend_prof_pos == "intro":
                blocks.append(pend_prof)
            blocks.append(f"#ejemplo[{body}]")
            if pend_prof_pos == "example_end":
                blocks.append(pend_prof)
            pend_prof = None
            pend_prof_pos = None
        else:
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
        cols_arg = table_cols_arg(table_buf)
        blocks.append(
            "#tbl((" + ", ".join(f"[{h}]" for h in head) + "), (" + ", ".join(rows) + ")" + cols_arg + ")"
        )
        table_buf = []
        if pend_after:
            blocks.append(fig_line(pend_after))
            pend_after = None

    def close_list() -> None:
        nonlocal list_lines, prev_marker, pend_prof
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

    def flush_prof() -> None:
        nonlocal pend_prof, pend_prof_pos, pend_after_text
        if pend_prof:
            blocks.append(pend_prof)
            pend_prof = None
            pend_prof_pos = None
        if pend_after_text:
            blocks.append(pend_after_text)
            pend_after_text = None

    def heading_block(level: int, title: str) -> None:
        nonlocal pend_before, pend_after, pend_prof, pend_prof_pos, intro_count, pend_after_text
        canon = title.strip()
        blocks.append("=" * level + " " + inline_typ(title))
        manual_art = W.MANUAL_ART.get(canon)
        if manual_art:
            width = "70%" if canon in W.MANUAL_ART_SIZE else "55%"
            width = MANUAL_ART_WIDTH.get(manual_art, width)
            blocks.append(fig_line(asset("manual", manual_art), width))
        elif canon in W.MANUAL_BANNER:
            banner_slug = W.MANUAL_BANNER[canon]
            if banner_slug in ("tiradas", "director"):
                blocks.append(f'#banner("{asset("manual", banner_slug)}")')
            else:
                blocks.append(fig_line(asset("manual", banner_slug)))
        elif canon in W.MANUAL_BANNER_BEFORE_TABLE:
            pend_before = asset("manual", W.MANUAL_BANNER_BEFORE_TABLE[canon])
        elif level == 3 and canon in W.PROFESSION_PORTRAITS:
            prof_img = fig_line(asset("professions", W.PROFESSION_PORTRAITS[canon]), "100%")
            pos = PROFESSION_IMG_POS.get(canon, "title")
            if pos == "title":
                blocks.append(prof_img)
            else:
                pend_prof = prof_img
                pend_prof_pos = pos
                intro_count = 0
        elif canon in W.CATALOG_BANNER:
            blocks.append(fig_line(asset("catalog", W.CATALOG_BANNER[canon])))
        elif canon in W.CATALOG_BANNER_AFTER_TABLE:
            pend_after = asset("catalog", W.CATALOG_BANNER_AFTER_TABLE[canon])
        elif canon in W.CATALOG_ART:
            arts = W.CATALOG_ART[canon]
            if len(arts) == 1:
                art_line = fig_line(asset("catalog", arts[0]), "100%")
            else:
                from PIL import Image as PILImage
                aspects = []
                for s in arts:
                    with PILImage.open(ROOT / "web" / "assets" / "catalog" / f"{s}.png") as im:
                        aspects.append(im.width / im.height)
                total = sum(aspects)
                frs = ", ".join(f"{a / total:.4f}fr" for a in aspects)
                paths = ", ".join(f'"{asset("catalog", s)}"' for s in arts)
                art_line = f"#figrow(({paths}), ({frs}))"
            if canon in CATALOG_ART_AFTER_TEXT:
                pend_after_text = art_line
            else:
                blocks.append(art_line)

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
            flush_prof()
            blocks.append("#sep()")
            i += 1
            continue

        m = HEADING_RE.match(stripped)
        if m:
            close_list()
            flush_pends()
            flush_prof()
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
            if pend_prof and pend_prof_pos == "arsenal":
                blocks.append(pend_prof)
                pend_prof = None
                pend_prof_pos = None
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
            if not legal_started:
                blocks.append("#colbreak()")
                legal_started = True
            blocks.append("#legal[" + inline_typ(stripped) + "]")
            i += 1
            continue

        close_list()
        flush_pends()
        blocks.append(inline_typ(stripped))
        if pend_after_text:
            blocks.append(pend_after_text)
            pend_after_text = None
        if pend_prof and pend_prof_pos == "mid_intro":
            intro_count += 1
            if intro_count >= 2:
                blocks.append(pend_prof)
                pend_prof = None
                pend_prof_pos = None
        i += 1

    flush_table()
    close_list()
    flush_quote()
    flush_pends()
    flush_prof()
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
        content = convert_chapter(chapter_text(CAPITULOS / name))
        if name == "06-glosario.md":
            idx = content.find("== Profesiones")
            if idx >= 0:
                parts.append("#chapter-block[\n" + content[:idx].rstrip() + "\n]")
                parts.append("#chapter-block[\n" + content[idx:] + "\n]")
                continue
        parts.append("#chapter-block[\n" + content + "\n]")
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
