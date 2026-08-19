# PbtA — Manual Cyberpunk

Dos salidas, una sola prosa:

| | Dónde |
|--|--------|
| **Fuente** | `docs/capitulos/` |
| **Imprimir (Word)** | `cyberpunk-pbta.docx` (**golden visual**, incl. hoja de personaje) |
| **Ficha (imprimir)** | `ficha.docx` (extraída del Word) |
| **Web** | [cyberpunk-pbta.vercel.app](https://cyberpunk-pbta.vercel.app) |

Capítulos: `00` Sistema → `01` Crear un Cyberpunk → `02` Cyberware → `04` Cromos → `05` Chapería → `06` Glosario.

El Word de trabajo **es** la maquetación. Copia de seguridad: `docs/ref/formato.docx`. No regenerar a ciegas: el builder no copia márgenes superiores página a página.

## Congelar / regenerar

```bash
python3 docs/scripts/build_ficha_docx.py --from-manual  # congela el Word actual + extrae la ficha
python3 docs/scripts/build_pbta_docx.py                 # no pisa el golden (sale 2)
python3 docs/scripts/build_pbta_docx.py --force         # regenera el Word (pierde maquetación)
python3 docs/scripts/build_web_reader.py                # web/data + fuente + portada
./docs/assets/fonts/install.sh                          # VT323 en el Mac, una vez
```

## Word — estilos congelados

| Estilo | Tamaño | Negrita | Color |
|--------|--------|---------|-------|
| Título 1 + barras `=====` (35) | 10 pt | **sí** | `#FFFF55` centrado |
| Título 2 | 12 pt | no | `#FFFF55` |
| Título 3 | 10 pt | no | `#55FFFF` |
| Título 4 | 9 pt | no | `#00FF00` |
| En la mesa | 8 pt | no | `#55FFFF` |
| Cuerpo | 8 pt | — | `#55FF55` |

Tema: `docs/assets/word-theme.yaml` + `docs/scripts/word_styles.py`. Layout documentado: `docs/assets/layout.yaml`. Original mecánico (solo lectura): `docs/ref/pbta-original.docx`. Inventario: `docs/inventario-reglas.md`.

Índice Word: Insertar → Tabla de contenido (Título 1–3).
