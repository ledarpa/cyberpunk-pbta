"""Orden canónico de capítulos + lectura compartida para los builds web y PDF."""

import re
from pathlib import Path

CHAPTER_FILES = [
    "00-sistema.md",
    "01-crear-un-cyberpunk.md",
    "02-cyberware-reglas-y-economia.md",
    "04-catalogo-cromos.md",
    "05-catalogo-chaperia.md",
    "06-glosario.md",
]

_BORRADOR_RE = re.compile(r"^> \*\*Borrador.*$\n?", re.M)


def chapter_text(path: Path) -> str:
    """Texto del capítulo sin la línea «> **Borrador…» del encabezado."""
    return _BORRADOR_RE.sub("", path.read_text(encoding="utf-8"))
