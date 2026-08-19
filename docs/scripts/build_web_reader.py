#!/usr/bin/env python3
"""Genera el paquete del lector web (HTML del manual + TOC) desde los capítulos Markdown."""
from __future__ import annotations

import json
import re
import shutil
from html import escape
from pathlib import Path
import sys

SCRIPTS = Path(__file__).resolve().parent
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from chapters import CHAPTER_FILES  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
CAPITULOS = ROOT / "docs" / "capitulos"
WEB = ROOT / "web"
DATA = WEB / "data"
FONT_SRC = ROOT / "docs" / "assets" / "fonts" / "VT323-Regular.ttf"
ASCII_SRC = ROOT / "docs" / "assets" / "portada-ascii.txt"

_LIST_RE = re.compile(r"^(?P<indent>[ \t]*)(?P<marker>[-*]|\d+\.)\s+(?P<body>.+)$")


def slugify(text: str, used: dict[str, int]) -> str:
    base = text.lower().strip()
    base = re.sub(r"[^\w\s\-áéíóúüñ]", "", base, flags=re.I)
    base = re.sub(r"\s+", "-", base)
    base = base.strip("-") or "seccion"
    n = used.get(base, 0)
    used[base] = n + 1
    return base if n == 0 else f"{base}-{n + 1}"


def inline_md(text: str) -> str:
    parts = re.split(r"(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)", text)
    out: list[str] = []
    for part in parts:
        if part.startswith("`") and part.endswith("`") and len(part) >= 2:
            out.append(f"<code>{escape(part[1:-1])}</code>")
        elif part.startswith("**") and part.endswith("**") and len(part) >= 4:
            out.append(f"<strong>{escape(part[2:-2])}</strong>")
        elif part.startswith("*") and part.endswith("*") and len(part) >= 2:
            out.append(f"<em>{escape(part[1:-1])}</em>")
        else:
            out.append(escape(part))
    return "".join(out)


def list_level(indent: str) -> int:
    expanded = indent.expandtabs(2)
    if not expanded:
        return 0
    return min(2, max(1, len(expanded) // 2))


def table_html(rows: list[list[str]]) -> str:
    if not rows:
        return ""
    cols = max(len(r) for r in rows)
    norm = [r + [""] * (cols - len(r)) for r in rows]
    thead = "".join(f"<th>{inline_md(c)}</th>" for c in norm[0])
    body_rows = []
    for r in norm[1:]:
        tds = "".join(f"<td>{inline_md(c)}</td>" for c in r)
        body_rows.append(f"<tr>{tds}</tr>")
    tbody = "\n".join(body_rows)
    return (
        '<div class="table-wrap"><table>'
        f"<thead><tr>{thead}</tr></thead>"
        f"<tbody>{tbody}</tbody>"
        "</table></div>"
    )


def md_to_html(content: str, used_ids: dict[str, int], toc: list[dict]) -> str:
    lines = content.splitlines()
    html: list[str] = []
    i = 0
    table_buffer: list[list[str]] = []
    list_stack: list[str] = []  # open list types

    def flush_table() -> None:
        nonlocal table_buffer
        if table_buffer:
            html.append(table_html(table_buffer))
            table_buffer = []

    def close_lists(to_level: int = -1) -> None:
        while len(list_stack) > to_level + 1:
            html.append(f"</{list_stack.pop()}>")

    def is_table_sep(s: str) -> bool:
        return bool(re.match(r"^\|[\s\-:|]+\|\s*$", s))

    def parse_row(s: str) -> list[str]:
        return [c.strip() for c in s.strip().strip("|").split("|")]

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if stripped.startswith("|") and "|" in stripped[1:]:
            close_lists()
            if is_table_sep(stripped):
                i += 1
                continue
            table_buffer.append(parse_row(stripped))
            i += 1
            continue
        flush_table()

        if not stripped:
            close_lists()
            i += 1
            continue

        if stripped == "---":
            close_lists()
            html.append("<hr>")
            i += 1
            continue

        heading = re.match(r"^(#{1,4})\s+(.+)$", stripped)
        if heading:
            close_lists()
            level = len(heading.group(1))
            title = heading.group(2).strip()
            hid = slugify(title, used_ids)
            toc.append({"id": hid, "level": level, "title": title})
            html.append(f'<h{level} id="{escape(hid)}">{inline_md(title)}</h{level}>')
            i += 1
            continue

        if stripped.startswith("> "):
            close_lists()
            html.append(f'<blockquote>{inline_md(stripped[2:].strip())}</blockquote>')
            i += 1
            continue

        if stripped.startswith("**En la mesa:**") or stripped.startswith("En la mesa:"):
            close_lists()
            html.append(f'<p class="mesa">{inline_md(stripped)}</p>')
            i += 1
            continue

        m = _LIST_RE.match(line.rstrip())
        if m:
            level = list_level(m.group("indent"))
            ordered = m.group("marker").endswith(".")
            tag = "ol" if ordered else "ul"
            while len(list_stack) > level + 1:
                html.append(f"</{list_stack.pop()}>")
            if len(list_stack) < level + 1:
                html.append(f"<{tag}>")
                list_stack.append(tag)
            elif list_stack and list_stack[-1] != tag and len(list_stack) == level + 1:
                html.append(f"</{list_stack.pop()}>")
                html.append(f"<{tag}>")
                list_stack.append(tag)
            html.append(f"<li>{inline_md(m.group('body').strip())}</li>")
            i += 1
            continue

        close_lists()
        html.append(f"<p>{inline_md(stripped)}</p>")
        i += 1

    flush_table()
    close_lists()
    return "\n".join(html)


def main() -> None:
    WEB.mkdir(parents=True, exist_ok=True)
    DATA.mkdir(parents=True, exist_ok=True)
    used: dict[str, int] = {}
    toc: list[dict] = []
    parts: list[str] = []

    for name in CHAPTER_FILES:
        path = CAPITULOS / name
        if not path.exists():
            raise FileNotFoundError(path)
        text = path.read_text(encoding="utf-8")
        text = re.sub(r"^> \*\*Borrador.*$\n?", "", text, flags=re.M)
        parts.append(f'<article class="chapter" data-file="{escape(name)}">')
        parts.append(md_to_html(text, used, toc))
        parts.append("</article>")

    body = "\n".join(parts)
    payload = {
        "html": body,
        "toc": toc,
        "title": "PbtA — Manual de reglas",
    }
    js = (
        "window.PBTA_MANUAL = "
        + json.dumps(payload, ensure_ascii=False)
        + ";\n"
    )
    (DATA / "manual.js").write_text(js, encoding="utf-8")
    shutil.copy2(ASCII_SRC, DATA / "portada-ascii.txt")
    fonts = WEB / "fonts"
    fonts.mkdir(parents=True, exist_ok=True)
    shutil.copy2(FONT_SRC, fonts / "VT323-Regular.ttf")
    print(f"OK {DATA / 'manual.js'} ({len(js)} chars, {len(toc)} headings)")


if __name__ == "__main__":
    main()
