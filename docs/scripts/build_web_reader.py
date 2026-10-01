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
CAPITULOS_EN = ROOT / "docs" / "capitulos-en"
WEB = ROOT / "web"
DATA = WEB / "data"
FONT_SRC = ROOT / "docs" / "assets" / "fonts" / "VT323-Regular.ttf"
FONT_SRC_WOFF2 = ROOT / "docs" / "assets" / "fonts" / "VT323-Regular.woff2"
ASCII_SRC = ROOT / "docs" / "assets" / "portada-ascii.txt"

_LIST_RE = re.compile(r"^(?P<indent>[ \t]*)(?P<marker>[-*]|\d+\.)\s+(?P<body>.+)$")

# Versión única del build web (cache bust + data/build.js).
WEB_BUILD_ID = "20260930a"

# Segunda columna de tabla Calidad → intro+título contornean imagen en wrap.
CALIDAD_WRAP_COL2 = frozenset({
    "Módulos disponibles",
    "Accesorios",
    "Mejora EN",
    "Efecto",
})

# Metadatos de maquetación por slug (única fuente: CSS data-* + JS layout).
ART_META: dict[str, dict[str, str]] = {
    "sai": {"layout": "portrait-top", "size": "cerebral"},
    "conexion_neuronal": {"layout": "portrait-top", "size": "cerebral"},
    "membrana_acorazada": {"layout": "portrait-top", "size": "sintetica"},
    "nanoplastia": {"layout": "portrait-top", "size": "sintetica"},
    "piel_perfecta": {"layout": "portrait-top", "size": "sintetica"},
    "vertebras": {"layout": "portrait-top", "size": "sintetica"},
    "neurochip": {"layout": "portrait-float", "size": "cerebral"},
    "primeros_auxilios": {"layout": "portrait-top", "size": "tool"},
    "trauma_card": {"layout": "portrait-top", "size": "tool"},
    "drone": {"layout": "portrait-span", "anchor": "table"},
}

# Cromos cuya sección abre con el h3 en línea propia antes del dibujo
# (como ojo / oído biónico); el wrap arranca debajo del título.
ART_HEADING_OUTSIDE_WRAP: frozenset[str] = frozenset({
    "membrana_acorazada",
    "nanoplastia",
    "piel_perfecta",
    "vertebras",
})

# Retratos de profesión (nombre display → slug PNG).
PROFESSION_PORTRAITS: dict[str, str] = {
    "Arreglador": "arreglador",
    "Artista": "artista",
    "Biohacker": "biohacker",
    "Comunicador": "comunicador",
    "Corpo": "corpo",
    "Espía": "espia",
    "Forastero": "forastero",
    "Mercenario": "mercenario",
    "Netrunner": "netrunner",
}

# Traducción de títulos EN → clave canónica ES. Los ids de heading, el arte,
# banners y el CSS por-id se keyean por el título ES: en el build EN se
# canoniza el título antes de consultar los dicts y antes de slugificar.
TITLE_EN: dict[str, str] = {
    # 00-sistema
    "When to Roll (and When Not To)": "Cuándo se tira (y cuándo no)",
    "The Four Attributes": "Los cuatro atributos",
    "Rolls (2d6 + Attribute)": "Tiradas (2d6 + atributo)",
    "Moves": "Movimientos",
    "The GM's Job": "Rol del Director",
    # 01-crear-un-cyberpunk — profesiones (retratos + ids canónicos)
    "Fixer": "Arreglador",
    "Artist": "Artista",
    "Biohacker": "Biohacker",
    "Media": "Comunicador",
    "Corpo": "Corpo",
    "Spook": "Espía",
    "Outsider": "Forastero",
    "Mercenary": "Mercenario",
    "Netrunner": "Netrunner",
    # 02-cyberware-reglas-y-economia — arte / banners / wraps
    "Attribute boosts": "Mejoras de características",
    "Neural degradation": "Degeneración neural",
    "Cyberpsychosis episodes": "Episodios de cyberpsicosis",
    "Getting your humanity back": "Recuperar la humanidad",
    # 04-catalogo-cromos — arte de catálogo / banners / rows
    "Smartgun link": "Conexión de arma inteligente",
    "Neural link": "Conexión neuronal",
    "Neurochip": "Neurochip",
    "Bionic eye": "Ojo biónico",
    "Bionic ear": "Oído biónico",
    "Modular digestive system": "Aparato digestivo modular",
    "Modular respiratory system": "Aparato respiratorio modular",
    "Armored membrane": "Membrana acorazada",
    "Nanoplasty": "Nanoplastía",
    "Perfect skin": "Piel perfecta",
    "Cyberspine": "Cybervértebras",
    "Combat arm": "Brazo de combate",
    "Ballistic limb": "Extremidad balística",
    "Cyberlegs": "Cyberpiernas",
    # 05-catalogo-chaperia — arte / banners / wrap intro
    "Pistol": "Pistola",
    "Shotgun": "Escopeta",
    "Assault rifle": "Fusil",
    "Sniper rifle": "Rifle",
    "Dart launcher": "Lanzadardos",
    "Missile launcher": "Lanzamisiles",
    "Grenades": "Granadas",
    "Drone": "Drone",
    "Mobile turret": "Torreta móvil",
    "Trauma card": "Trauma card",
    "Ghost mask": "Máscara fantasma",
    "First aid kit": "Kit de primeros auxilios",
    "Grapple gun": "Pistola garfio",
    "Corposuit": "Corposuit",
    "Tech armor": "Tecnoarmadura",
}

# Headers de tabla EN → canon ES, solo para lógica de layout (rail, wrap,
# clase t-calidad). El texto mostrado queda en EN.
TABLE_HEAD_EN: dict[str, str] = {
    "Quality": "Calidad",
    "Aspect": "Aspecto",
    "Subsystems": "Subsistemas",
    "Available modules": "Módulos disponibles",
    "Accessories": "Accesorios",
    "NE boost": "Mejora EN",
    "Effect": "Efecto",
    "Modules": "Módulos",
}

MANUAL_TITLES: dict[str, str] = {
    "es": "PbtA — Manual de reglas",
    "en": "PbtA — Rulebook",
}

# Arte de catálogo (cromos / chapería): título MD → archivos en web/assets/catalog/.
CATALOG_ART: dict[str, list[str]] = {
    # Armas
    "Pistola": ["pistola"],
    "Escopeta": ["escopeta"],
    "Fusil": ["fusil"],
    "Rifle": ["rifle"],
    "Lanzadardos": ["lanzadardos"],
    "Lanzamisiles": ["lanzamisiles"],
    "Granadas": ["granadas"],
    # Herramientas / vestimenta
    "Drone": ["drone"],
    "Torreta móvil": ["torreta"],
    "Trauma card": ["trauma_card"],
    "Máscara fantasma": ["mascara_fantasma"],
    "Kit de primeros auxilios": ["primeros_auxilios"],
    "Pistola garfio": ["garfio"],
    # Cromos
    "Conexión de arma inteligente": ["sai"],
    "Conexión neuronal": ["conexion_neuronal"],
    "Neurochip": ["neurochip"],
    "Ojo biónico": ["ojo"],
    "Oído biónico": ["cyberoido"],
    "Membrana acorazada": ["membrana_acorazada"],
    "Nanoplastía": ["nanoplastia"],
    "Piel perfecta": ["piel_perfecta"],
    "Cybervértebras": ["vertebras"],
    "Brazo de combate": ["sable_mantis", "magnetoescudo"],
    "Extremidad balística": ["balistica"],
    "Cyberpiernas": ["acorazado", "cuadrupedo", "velocista"],
}

# Secciones con intro + tabla (cabecera distinta de Calidad) en wrap flotante.
CATALOG_ART_INTRO_WRAP: frozenset[str] = frozenset({
    "Trauma card",
})

CATALOG_BANNER: dict[str, str] = {
    "Aparato digestivo modular": "bucales",
    "Aparato respiratorio modular": "cybernasales",
}

# Banner tras la 1.ª tabla de la sección (p. ej. Calidad → imagen → Modos).
CATALOG_BANNER_AFTER_TABLE: dict[str, str] = {
    "Corposuit": "corposuit",
    "Tecnoarmadura": "tecnoarmadura",
}

# Ilustraciones del manual (capítulos, no catálogo): float derecha junto al texto.
MANUAL_ART: dict[str, str] = {    "Cuándo se tira (y cuándo no)": "2d6",    "Mejoras de características": "mejora_de_atributos",    "Degeneración neural": "degeneracion",    "Recuperar la humanidad": "recuperar_humanidad",    "Ojo biónico": "ojo",    "Oído biónico": "cyberoido",        # Membrana acorazada - usa membrana_acorazada.png del catalog    "Membrana acorazada": "membrana_acorazada",        # Nanoplastia - usa nanoplastia.png del catalog    "Nanoplastia": "nanoplastia",        # Piel perfecta - usa piel_perfecta.png del manual    "Piel perfecta": "piel_perfecta",        # Cibervértebras - usa vertebras.png del catalog    "Cibervértebras": "vertebras",        # Extremidad balística - usa balistica.png del catalog    "Extremidad balística": "balistica",        # Armas del armamento inicial    "Pistola": "pistola",    "Escopeta": "escopeta",    "Fusil": "fusil",    "Rifle": "rifle",    "Lanzamisiles": "lanzamisiles",        # Otros    "Drone": "drone",    "Kit de primeros auxilios": "primeros_auxilios",    "Traumacard": "trauma_card",        # Los ya existentes mantenidos    "Conexión dearma inteligente": "conexion_neuronal",    "Conexión neuronal": "conexion_neuronal",    "Neurochip": "neurochip",
}
# Validation: ensure all MANUAL_ART asset paths exist
_MANUAL_ART_VALIDATE: bool = False
try:
    manual_dir = Path(__file__).resolve().parents[2] / 'web' / 'assets' / 'manual'
    catalog_dir = Path(__file__).resolve().parents[2] / 'web' / 'assets' / 'catalog'
    for title, stem in MANUAL_ART.items():
        # Check both manual/{stem}.png and catalog/{stem}.png
        manual_path = manual_dir / f'{stem}.png'
        catalog_path = catalog_dir / f'{stem}.png'
        if not manual_path.exists() and not catalog_path.exists():
            print(f'WARNING: MANUAL_ART entry "{title}" references non-existent asset stem "{stem}"')
            print(f'  Looked for: manual/{stem}.png and catalog/{stem}.png')
    if _MANUAL_ART_VALIDATE:
        pass  # validation runs at import time if enabled
except Exception as e:
    print(f'MANUAL_ART validation error: {e}')
 
MANUAL_BANNER: dict[str, str] = {
    "Episodios de cyberpsicosis": "cyberpsicosis",
    "Rol del Director": "director",
    "Movimientos": "tiradas",
}

# Banner entre el párrafo intro y la 1.ª tabla de la sección.
MANUAL_BANNER_BEFORE_TABLE: dict[str, str] = {
    "Los cuatro atributos": "atributos",
}

# Secciones cuyo dibujo va al rail de la 1.ª tabla (intro arriba; tabla dentro del wrap).
MANUAL_ART_TABLE_WRAP: frozenset[str] = frozenset({
    "Mejoras de características",
})

# Secciones cuyo dibujo bordea todo el bloque de prosa (cierra en --- / siguiente título).
MANUAL_ART_COPY_WRAP: frozenset[str] = frozenset({
    "Cuándo se tira (y cuándo no)",
    "Degeneración neural",
    "Recuperar la humanidad",
})

# Tamaño extra por slug (default en CSS: data-art-size="manual").
MANUAL_ART_SIZE: dict[str, str] = {
    "mejora_de_atributos": "manual-xl",
}


def asset_url(path: str) -> str:
    return f"{path}?v={WEB_BUILD_ID}"


def profession_portrait_html(slug: str) -> str:
    src = escape(asset_url(f"assets/professions/{slug}.png"))
    return (
        '<figure class="book-prof-portrait" aria-hidden="true">'
        f'<img src="{src}" alt="" loading="lazy" width="240" height="240">'
        "</figure>"
    )


def catalog_banner_html(slug: str) -> str:
    src = escape(asset_url(f"assets/catalog/{slug}.png"))
    return (
        '<figure class="book-item-banner" aria-hidden="true">'
        f'<img src="{src}" alt="" loading="lazy">'
        "</figure>"
    )


def manual_banner_html(slug: str) -> str:
    src = escape(asset_url(f"assets/manual/{slug}.png"))
    return (
        '<figure class="book-item-banner" aria-hidden="true">'
        f'<img src="{src}" alt="" loading="lazy">'
        "</figure>"
    )


def manual_art_html(
    slug: str,
    *,
    layout: str = "portrait-float",
    anchor: str | None = None,
    size: str = "manual",
) -> str:
    src = escape(asset_url(f"assets/manual/{slug}.png"))
    anchor_attr = f' data-art-anchor="{escape(anchor)}"' if anchor else ""
    return (
        f'<figure class="book-item-art book-item-art--{escape(slug)}" '
        f'data-art-layout="{escape(layout)}" data-art-size="{escape(size)}"{anchor_attr} '
        f'aria-hidden="true"><img src="{src}" alt="" loading="lazy"></figure>'
    )


def art_figure_html(slug: str) -> str:
    src = escape(asset_url(f"assets/catalog/{slug}.png"))
    meta = ART_META.get(slug, {})
    attrs = ""
    if layout := meta.get("layout"):
        attrs += f' data-art-layout="{escape(layout)}"'
    if size := meta.get("size"):
        attrs += f' data-art-size="{escape(size)}"'
    if anchor := meta.get("anchor"):
        attrs += f' data-art-anchor="{escape(anchor)}"'
    return (
        f'<figure class="book-item-art book-item-art--{escape(slug)}"{attrs} '
        f'aria-hidden="true"><img src="{src}" alt="" loading="lazy"></figure>'
    )


def catalog_art_html(slugs: list[str]) -> str:
    if not slugs:
        return ""
    figures = [art_figure_html(slug) for slug in slugs]
    if len(figures) == 1:
        return figures[0]
    row_class = "book-item-art-row"
    if slugs == ["acorazado", "cuadrupedo", "velocista"]:
        row_class += " book-item-art-row--cyberpiernas"
    return (
        f'<div class="{row_class}" aria-hidden="true">'
        + "".join(figures)
        + "</div>"
    )


def slugify(text: str, used: dict[str, int]) -> str:
    base = text.lower().strip()
    base = re.sub(r"[^\w\s\-áéíóúüñ]", "", base, flags=re.I)
    base = re.sub(r"\s+", "-", base)
    base = base.strip("-") or "seccion"
    n = used.get(base, 0)
    used[base] = n + 1
    return base if n == 0 else f"{base}-{n + 1}"


def inline_md(text: str) -> str:
    parts = re.split(r"(`[^`]+`|\*\*[^*]+\*\*|==[^=]+==|\*[^*]+\*)", text)
    out: list[str] = []
    for part in parts:
        if part.startswith("`") and part.endswith("`") and len(part) >= 2:
            out.append(f"<code>{escape(part[1:-1])}</code>")
        elif part.startswith("**") and part.endswith("**") and len(part) >= 4:
            out.append(f"<strong>{escape(part[2:-2])}</strong>")
        elif part.startswith("==") and part.endswith("==") and len(part) >= 4:
            # ==palabra== → tinta cian (resaltado de voz en ejemplos)
            out.append(f'<span class="hl-cyan">{escape(part[2:-2])}</span>')
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


def table_html(rows: list[list[str]], *, rail: bool = False, lang: str = "es") -> str:
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
    wrap = "table-wrap table-wrap--rail" if rail else "table-wrap"
    # Tablas de Calidad: col1 uniforme en todo el juego (CSS fija su ancho)
    head0 = norm[0][0].strip()
    if lang == "en":
        head0 = TABLE_HEAD_EN.get(head0, head0)
    if head0 == "Calidad":
        tcls = ' class="t-calidad"'
    elif head0 == "Aspecto":
        tcls = ' class="t-aspecto"'
    else:
        tcls = ""
    return (
        f'<div class="{wrap}"><table{tcls}>'
        f"<thead><tr>{thead}</tr></thead>"
        f"<tbody>{tbody}</tbody>"
        "</table></div>"
    )


def md_to_html(content: str, used_ids: dict[str, int], toc: list[dict], *, lang: str = "es") -> str:
    # EN: títulos y headers de tabla se canonizan a su clave ES para toda la
    # lógica (arte, banners, rail/wrap, ids de heading); el display queda EN.
    canon_title = (lambda t: TITLE_EN.get(t, t)) if lang == "en" else (lambda t: t)
    canon_head = (lambda h: TABLE_HEAD_EN.get(h, h)) if lang == "en" else (lambda h: h)
    lines = content.splitlines()
    html: list[str] = []
    i = 0
    table_buffer: list[list[str]] = []
    list_stack: list[str] = []  # open list types
    pending_portrait: str | None = None
    pending_catalog_art: list[str] | None = None
    catalog_after_first_table = False
    catalog_art_open = False  # dibujo recién emitido → 1.ª tabla Calidad puede ir al rail
    pending_art_wrap = False  # wrap: título+intro+tabla contornean imagen
    art_wrap_open = False
    art_wrap_rail_plus_list = False  # Drone: rail Calidad + ul stats dentro del wrap
    pending_manual_art_wrap: str | None = None
    pending_manual_art_anchor: str = "table"
    pending_manual_banner_before_table: str | None = None
    pending_catalog_banner_after_table: str | None = None
    manual_art_in_wrap = False
    manual_art_anchor: str = "table"
    quote_buffer: list[str] | None = None  # blockquotes consecutivos → un bloque

    def flush_quote() -> None:
        nonlocal quote_buffer
        if quote_buffer is None:
            return
        is_ejemplo = quote_buffer[0].startswith(("**Ejemplo", "**Example"))
        if is_ejemplo:
            # La línea "Ejemplo — X" es solo marcador de estilo (rosa):
            # no se emite; el ejemplo arranca directo en la situación.
            quote_buffer = quote_buffer[1:]
        cls = ' class="ejemplo"' if is_ejemplo else ""
        ps = "".join(f"<p>{inline_md(q)}</p>" for q in quote_buffer if q)
        if ps:
            html.append(f"<blockquote{cls}>{ps}</blockquote>")
        quote_buffer = None

    def emit_catalog_art(slugs: list[str], *, wrap: bool = False) -> None:
        nonlocal catalog_art_open, art_wrap_open
        if wrap:
            html.append('<div class="book-art-wrap">')
            html.append(catalog_art_html(slugs))
            html.append('<div class="book-art-wrap-copy">')
            art_wrap_open = True
        else:
            html.append(catalog_art_html(slugs))
        catalog_art_open = True

    def close_art_wrap() -> None:
        nonlocal art_wrap_open, manual_art_in_wrap, manual_art_anchor
        if art_wrap_open:
            html.append("</div></div>")
            html.append('<div class="book-float-boundary" aria-hidden="true"></div>')
            art_wrap_open = False
            manual_art_in_wrap = False
            manual_art_anchor = "table"

    def open_manual_art_wrap(slug: str, *, anchor: str = "table") -> None:
        nonlocal art_wrap_open, manual_art_in_wrap, pending_manual_art_wrap, manual_art_anchor
        layout = "portrait-float" if slug == "2d6" else "portrait-span"
        html.append('<div class="book-art-wrap">')
        html.append(
            manual_art_html(
                slug,
                layout=layout,
                anchor=anchor,
                size=MANUAL_ART_SIZE.get(slug, "manual"),
            )
        )
        html.append('<div class="book-art-wrap-copy">')
        art_wrap_open = True
        manual_art_in_wrap = True
        manual_art_anchor = anchor
        pending_manual_art_wrap = None

    def flush_table() -> None:
        nonlocal table_buffer, pending_catalog_art, catalog_after_first_table, catalog_art_open, art_wrap_rail_plus_list, manual_art_in_wrap, pending_catalog_banner_after_table
        if table_buffer:
            head = canon_head((table_buffer[0][0] if table_buffer[0] else "").strip())
            if art_wrap_open and art_wrap_rail_plus_list and head != "Calidad":
                close_art_wrap()
                art_wrap_rail_plus_list = False
            rail = False
            if manual_art_in_wrap and art_wrap_open and manual_art_anchor == "table":
                rail = True
            elif catalog_art_open:
                rail = art_wrap_open or head == "Calidad"
                catalog_art_open = False
            html.append(table_html(table_buffer, rail=rail, lang=lang))
            table_buffer = []
            if pending_catalog_banner_after_table:
                html.append(catalog_banner_html(pending_catalog_banner_after_table))
                pending_catalog_banner_after_table = None
            if manual_art_in_wrap and manual_art_anchor == "table":
                close_art_wrap()
            elif rail and not art_wrap_rail_plus_list:
                close_art_wrap()
            if catalog_after_first_table and pending_catalog_art:
                emit_catalog_art(pending_catalog_art)
                pending_catalog_art = None
                catalog_after_first_table = False

    def close_lists(to_level: int = -1) -> None:
        while len(list_stack) > to_level + 1:
            html.append(f"</{list_stack.pop()}>")

    def flush_portrait() -> None:
        nonlocal pending_portrait
        if pending_portrait:
            html.append(profession_portrait_html(pending_portrait))
            pending_portrait = None

    def flush_catalog_art() -> None:
        nonlocal pending_catalog_art, catalog_after_first_table, pending_art_wrap
        if pending_catalog_art:
            emit_catalog_art(pending_catalog_art, wrap=pending_art_wrap)
            pending_catalog_art = None
            pending_art_wrap = False
            catalog_after_first_table = False

    def close_catalog_section() -> None:
        """Cierra arte pendiente y evita que el rail/float contamine el siguiente bloque."""
        nonlocal catalog_art_open, pending_art_wrap, art_wrap_rail_plus_list, pending_manual_art_wrap, manual_art_in_wrap, pending_manual_art_anchor, pending_manual_banner_before_table, pending_catalog_banner_after_table
        pending_art_wrap = False
        art_wrap_rail_plus_list = False
        pending_manual_art_wrap = None
        pending_manual_art_anchor = "table"
        pending_manual_banner_before_table = None
        pending_catalog_banner_after_table = None
        manual_art_in_wrap = False
        flush_catalog_art()
        close_art_wrap()
        catalog_art_open = False

    def next_nonempty(from_idx: int) -> str:
        for j in range(from_idx, len(lines)):
            s = lines[j].strip()
            if s:
                return s
        return ""

    def peek_first_table_cols(from_idx: int) -> tuple[str, str] | None:
        for j in range(from_idx, len(lines)):
            s = lines[j].strip()
            if not s:
                continue
            if s == "---":
                return None
            if s.startswith("#"):
                level = len(re.match(r"^(#{1,6})\s", s).group(1))
                if level <= 3:
                    return None
                continue
            if s.startswith("|") and "|" in s[1:]:
                if is_table_sep(s):
                    continue
                cells = parse_row(s)
                if not cells:
                    return None
                c0 = canon_head(cells[0].strip())
                c1 = canon_head(cells[1].strip()) if len(cells) > 1 else ""
                return (c0, c1)
        return None

    def is_table_sep(s: str) -> bool:
        return bool(re.match(r"^\|[\s\-:|]+\|\s*$", s))

    def parse_row(s: str) -> list[str]:
        return [c.strip() for c in s.strip().strip("|").split("|")]

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        if not (stripped.startswith("> ") or stripped == ">"):
            flush_quote()

        if stripped.startswith("|") and "|" in stripped[1:]:
            close_lists()
            flush_portrait()
            if pending_manual_banner_before_table and not is_table_sep(stripped):
                html.append(manual_banner_html(pending_manual_banner_before_table))
                pending_manual_banner_before_table = None
            if pending_manual_art_wrap and not is_table_sep(stripped):
                open_manual_art_wrap(
                    pending_manual_art_wrap,
                    anchor=pending_manual_art_anchor,
                )
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
            flush_portrait()
            close_catalog_section()
            html.append('<div class="book-section-break"><hr></div>')
            i += 1
            continue

        heading = re.match(r"^(#{1,4})\s+(.+)$", stripped)
        if heading:
            close_lists()
            flush_portrait()
            level = len(heading.group(1))
            title = heading.group(2).strip()
            canon = canon_title(title)
            # ¿Este encabezado trae arte o banner propio? Eso requiere su propio wrap.
            heading_own_art = (
                level == 3 and canon in PROFESSION_PORTRAITS
            ) or canon in CATALOG_ART or canon in CATALOG_BANNER or canon in CATALOG_BANNER_AFTER_TABLE or canon in MANUAL_ART or canon in MANUAL_BANNER or canon in MANUAL_BANNER_BEFORE_TABLE
            # h4 sin arte propio dentro de un wrap abierto → no cortar el wrap:
            # el contenido (texto, tablas) sigue contorneando la imagen de la sección madre.
            keep_wrap_open = level >= 4 and not heading_own_art and art_wrap_open
            if not keep_wrap_open:
                close_catalog_section()
            hid = slugify(canon, used_ids)
            toc.append({"id": hid, "level": level, "title": title})
            heading_html = f'<h{level} id="{escape(hid)}">{inline_md(title)}</h{level}>'
            wrap_heading = False

            # Si el wrap de prosa sigue abierto, el h4 va dentro del copy
            if manual_art_in_wrap and manual_art_anchor == "copy" and level >= 4:
                html.append(heading_html)
                i += 1
                continue

            manual_art = MANUAL_ART.get(canon)
            manual_banner = MANUAL_BANNER.get(canon)
            manual_banner_mid = MANUAL_BANNER_BEFORE_TABLE.get(canon)
            if manual_art:
                html.append(heading_html)
                if canon in MANUAL_ART_TABLE_WRAP:
                    pending_manual_art_wrap = manual_art
                    pending_manual_art_anchor = "table"
                elif canon in MANUAL_ART_COPY_WRAP:
                    pending_manual_art_wrap = manual_art
                    pending_manual_art_anchor = "copy"
                else:
                    html.append(
                        manual_art_html(
                            manual_art,
                            size=MANUAL_ART_SIZE.get(manual_art, "manual"),
                        )
                    )
            elif manual_banner:
                html.append(heading_html)
                html.append(manual_banner_html(manual_banner))
            elif manual_banner_mid:
                html.append(heading_html)
                pending_manual_banner_before_table = manual_banner_mid
            else:
                if level == 3:
                    pending_portrait = PROFESSION_PORTRAITS.get(canon)
                banner = CATALOG_BANNER.get(canon)
                banner_after_table = CATALOG_BANNER_AFTER_TABLE.get(canon)
                if banner:
                    html.append(heading_html)
                    html.append(catalog_banner_html(banner))
                elif banner_after_table:
                    html.append(heading_html)
                    pending_catalog_banner_after_table = banner_after_table
                else:
                    art = CATALOG_ART.get(canon)
                    if art:
                        pending_catalog_art = art
                        nxt = next_nonempty(i + 1)
                        cols = peek_first_table_cols(i + 1)
                        first_th = cols[0] if cols else None
                        col2 = cols[1] if cols else ""
                        if first_th == "Calidad" and col2 == "Subsistemas":
                            pending_art_wrap = True
                            wrap_heading = True
                            art_wrap_rail_plus_list = True
                            catalog_after_first_table = False
                        elif first_th == "Calidad" and nxt.startswith("|"):
                            pending_art_wrap = True
                            wrap_heading = True
                            catalog_after_first_table = False
                        elif first_th == "Calidad" and col2 in CALIDAD_WRAP_COL2:
                            pending_art_wrap = True
                            wrap_heading = True
                            catalog_after_first_table = False
                        elif first_th == "Calidad" and col2 == "Módulos":
                            pending_art_wrap = True
                            wrap_heading = True
                            catalog_after_first_table = False
                        elif first_th == "Calidad":
                            pending_art_wrap = True
                            wrap_heading = True
                            catalog_after_first_table = False
                        elif canon in CATALOG_ART_INTRO_WRAP:
                            pending_art_wrap = True
                            wrap_heading = True
                            catalog_after_first_table = False
                        elif nxt.startswith("|") and "|" in nxt[1:]:
                            html.append(heading_html)
                            catalog_after_first_table = True
                        else:
                            html.append(heading_html)
                            flush_catalog_art()
                    else:
                        html.append(heading_html)

                if wrap_heading and pending_catalog_art:
                    if all(s in ART_HEADING_OUTSIDE_WRAP for s in pending_catalog_art):
                        html.append(heading_html)
                        emit_catalog_art(pending_catalog_art, wrap=True)
                    else:
                        emit_catalog_art(pending_catalog_art, wrap=True)
                        html.append(heading_html)
                    pending_catalog_art = None
            i += 1
            continue

        img_line = re.match(r"^!\[([^\]]*)\]\(([^)]+)\)$", stripped)
        if img_line:
            close_lists()
            flush_portrait()
            flush_catalog_art()
            alt = img_line.group(1).strip()
            src_path = img_line.group(2).strip()
            # Banners panorámicos del manual: ![](assets/manual/slug.png)
            if src_path.startswith("assets/manual/") and src_path.endswith(".png"):
                slug = Path(src_path).stem
                html.append(manual_banner_html(slug))
            else:
                src = escape(asset_url(src_path))
                alt_attr = f' alt="{escape(alt)}"' if alt else ' alt=""'
                html.append(
                    f'<figure class="book-item-banner" aria-hidden="true">'
                    f'<img src="{src}"{alt_attr} loading="lazy">'
                    f"</figure>"
                )
            i += 1
            continue

        if stripped.startswith("> ") or stripped == ">":
            close_lists()
            flush_portrait()
            flush_catalog_art()
            content = stripped[2:].strip() if stripped.startswith("> ") else ""
            if quote_buffer is None:
                quote_buffer = []
            quote_buffer.append(content)
            i += 1
            continue

        if any(
            stripped.startswith(p)
            for p in ("**En la mesa:**", "En la mesa:", "**At the table:**", "At the table:")
        ):
            close_lists()
            html.append(f'<p class="mesa">{inline_md(stripped)}</p>')
            flush_portrait()
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
                flush_portrait()
                flush_catalog_art()
                if pending_manual_art_wrap:
                    open_manual_art_wrap(
                        pending_manual_art_wrap,
                        anchor=pending_manual_art_anchor,
                    )
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
        flush_portrait()
        flush_catalog_art()
        if pending_manual_art_wrap:
            open_manual_art_wrap(
                pending_manual_art_wrap,
                anchor=pending_manual_art_anchor,
            )
        # Disclaimer legal (Homebrew Content Policy RTG): párrafo marcado
        cls = ' class="legal"' if stripped.startswith("Cyberpunk-PbtA is unofficial") else ""
        html.append(f"<p{cls}>{inline_md(stripped)}</p>")
        i += 1

    flush_table()
    close_lists()
    flush_portrait()
    flush_catalog_art()
    flush_quote()
    return "\n".join(html)


def write_build_js() -> None:
    payload = {"id": WEB_BUILD_ID, "professions": PROFESSION_PORTRAITS}
    (DATA / "build.js").write_text(
        "window.PBTA_BUILD = " + json.dumps(payload, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )


def patch_index_cache() -> None:
    html_path = WEB / "index.html"
    text = html_path.read_text(encoding="utf-8")
    patched = re.sub(r"\?v=[^\"']+", f"?v={WEB_BUILD_ID}", text)
    if patched != text:
        html_path.write_text(patched, encoding="utf-8")


def build_manual(lang: str) -> tuple[dict, list[str]]:
    """Construye el payload del manual en un idioma.

    EN: usa docs/capitulos-en/ con fallback por capítulo al español;
    devuelve la lista de capítulos que quedaron en fallback.
    """
    src = CAPITULOS if lang == "es" else CAPITULOS_EN
    used: dict[str, int] = {}
    toc: list[dict] = []
    parts: list[str] = []
    fallback: list[str] = []

    for name in CHAPTER_FILES:
        path = src / name
        if not path.exists() and lang == "en":
            path = CAPITULOS / name
            fallback.append(name)
        if not path.exists():
            raise FileNotFoundError(path)
        text = path.read_text(encoding="utf-8")
        text = re.sub(r"^> \*\*Borrador.*$\n?", "", text, flags=re.M)
        parts.append(f'<article class="chapter" data-file="{escape(name)}">')
        parts.append(md_to_html(text, used, toc, lang=lang))
        parts.append("</article>")

    payload = {
        "html": "\n".join(parts),
        "toc": toc,
        "title": MANUAL_TITLES[lang],
    }
    return payload, fallback


def write_manual_js() -> list[str]:
    es_payload, _ = build_manual("es")
    en_payload, en_fallback = build_manual("en")
    (DATA / "manual.js").write_text(
        "window.PBTA_MANUAL = " + json.dumps(es_payload, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    (DATA / "manual-en.js").write_text(
        "window.PBTA_MANUAL_EN = " + json.dumps(en_payload, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    return en_fallback


def main() -> None:
    WEB.mkdir(parents=True, exist_ok=True)
    DATA.mkdir(parents=True, exist_ok=True)

    en_fallback = write_manual_js()
    if en_fallback:
        print(f"EN con fallback a ES: {', '.join(en_fallback)}")
    shutil.copy2(ASCII_SRC, DATA / "portada-ascii.txt")
    fonts = WEB / "fonts"
    fonts.mkdir(parents=True, exist_ok=True)
    shutil.copy2(FONT_SRC, fonts / "VT323-Regular.ttf")
    shutil.copy2(FONT_SRC_WOFF2, fonts / "VT323-Regular.woff2")
    write_build_js()
    patch_index_cache()
    print(f"OK {DATA / 'manual.js'} + manual-en.js (build={WEB_BUILD_ID})")


if __name__ == "__main__":
    main()
