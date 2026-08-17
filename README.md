# pbta — Manual PbtA Cyberpunk

Reglamento en Markdown, Word maquetado y lector web (terminal DOS).

## Estructura

| Ruta | Qué es |
|------|--------|
| `docs/capitulos/` | Fuente de la prosa |
| `docs/inventario-reglas.md` | Control mecánico (no cambiar números a ciegas) |
| `docs/assets/` | Tema Word, layout, portada ASCII, fuente VT323 |
| `docs/ref/` | Solo lectura: original + golden de maquetación |
| `docs/scripts/` | Builders (Word, web, export texto) |
| `cyberpunk-pbta.docx` | Word de trabajo (raíz) |
| `web/` | Lector estático |

Capítulos ensamblados: `00` Sistema → `01` Crear un Cyberpunk → `02` Cyberware → `04` Cromos → `05` Chapería → `06` Glosario.

## Lector web

```bash
python3 docs/scripts/build_web_reader.py
python3 web/serve.py
```

http://127.0.0.1:8765/

## Word

```bash
./docs/assets/fonts/install.sh          # VT323, una vez
python3 docs/scripts/build_pbta_docx.py # escribe cyberpunk-pbta.docx
```

Un rebuild **no** copia márgenes superiores página a página del golden. Estilos: ver `docs/README-editorial.md`.

## Export texto (opcional)

```bash
python3 docs/scripts/export_texto_completo.py
```

Sale en `docs/.generated/` (gitignored).
