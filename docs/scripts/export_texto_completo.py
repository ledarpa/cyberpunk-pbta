#!/usr/bin/env python3
"""Exporta el contenido editorial a modo texto (docs/contenido).

docs/ref/ es solo lectura: se puede leer el original, no se escribe ahí.
"""
from __future__ import annotations

import re
from pathlib import Path

from docx import Document

ROOT = Path(__file__).resolve().parents[2]
CAPITULOS = ROOT / "docs" / "capitulos"
CONTENIDO = ROOT / "docs" / "contenido"
REF = ROOT / "docs" / "ref"  # solo lectura

CHAPTER_FILES = [
    "00-sistema.md",
    "01-crear-un-cyberpunk.md",
    "02-cyberware-reglas-y-economia.md",
    "04-catalogo-cromos.md",
    "05-catalogo-chaperia.md",
    "06-glosario.md",
]


def extract_docx(path: Path) -> str:
    doc = Document(path)
    lines: list[str] = []
    for p in doc.paragraphs:
        lines.append(p.text)
    for ti, t in enumerate(doc.tables):
        lines.append(f"\n[TABLA {ti + 1}]")
        for row in t.rows:
            lines.append(" | ".join(c.text.replace("\n", " ").strip() for c in row.cells))
    return "\n".join(lines) + "\n"


def build_manual_completo() -> str:
    parts: list[str] = [
        "pbta — MANUAL COMPLETO (texto)\n",
        "Fuente: docs/capitulos/*.md (edición clara / reorganizada)\n",
        "Referencia original (solo lectura): docs/ref/pbta-original.docx\n",
        "Word generado: cyberpunk-pbta.docx (raíz del proyecto)\n",
        "=" * 72 + "\n",
    ]
    for name in CHAPTER_FILES:
        path = CAPITULOS / name
        if not path.exists():
            raise FileNotFoundError(path)
        text = path.read_text(encoding="utf-8")
        text = re.sub(r"^> \*\*Borrador.*$\n?", "", text, flags=re.M).strip() + "\n"
        parts.append("\n" + "=" * 72 + "\n")
        parts.append(f"ARCHIVO: {name}\n")
        parts.append("=" * 72 + "\n\n")
        parts.append(text)
    return "".join(parts)


def main() -> None:
    CONTENIDO.mkdir(parents=True, exist_ok=True)

    completo = build_manual_completo()
    (CONTENIDO / "MANUAL-completo.txt").write_text(completo, encoding="utf-8")
    print(f"OK {CONTENIDO / 'MANUAL-completo.txt'} ({len(completo)} chars)")

    # Leer original desde ref (no modificar ref)
    orig = REF / "pbta-original.docx"
    if orig.exists():
        txt = extract_docx(orig)
        out = CONTENIDO / "pbta-original-extract.txt"
        out.write_text(txt, encoding="utf-8")
        print(f"OK {out} (leído desde ref/, escrito en contenido/)")


if __name__ == "__main__":
    main()
