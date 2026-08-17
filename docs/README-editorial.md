# Editorial — manual pbta

Orquestación: skill **`arquitecto-manual-pbta`**.

## Fuente de verdad

| Qué | Dónde |
|-----|--------|
| Word maquetado (golden) | `ref/formato.docx` |
| Word de trabajo | `../cyberpunk-pbta.docx` |
| Prosa / reglas | `capitulos/` |
| Estilos al regenerar | `scripts/word_styles.py` + `assets/word-theme.yaml` |
| Layout documentado | `assets/layout.yaml` |
| Original mecánico | `ref/pbta-original.docx` (solo lectura) |
| Inventario de reglas | `inventario-reglas.md` |

## Estilos congelados

| Estilo | Tamaño | Negrita | Color |
|--------|--------|---------|-------|
| Título 1 + barras `=====` (35) | 10 pt | **sí** | `#FFFF55` centrado |
| Título 2 | 12 pt | no | `#FFFF55` |
| Título 3 | 10 pt | no | `#55FFFF` |
| Título 4 | 9 pt | no | `#00FF00` |
| En la mesa | 8 pt | no | `#55FFFF` |
| Cuerpo | 8 pt | — | `#55FF55` |

Portada: ASCII + subtítulo **MANUAL DE REGLAS**. Capítulos a 1 columna (título) / 2 columnas (cuerpo).

## Generar

```bash
python3 docs/scripts/build_pbta_docx.py   # Word → raíz
python3 docs/scripts/build_web_reader.py  # web/data + fuente/portada
python3 docs/scripts/export_texto_completo.py  # docs/.generated/
./docs/assets/fonts/install.sh            # VT323 en el sistema
```

**Anti-huérfano:** títulos `keepNext`/`keepLines`; cuerpo `widowControl`; párrafo antes de tabla `keepNext`; filas `cantSplit`.

**Índice Word:** Insertar → Tabla de contenido (Título 1–3).
