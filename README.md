# PbtA — Manual Cyberpunk

Una salida web desde una sola prosa:

| | Dónde |
|--|--------|
| **Fuente** | `docs/capitulos/` |
| **Web** | [cyberpunk-pbta.vercel.app](https://cyberpunk-pbta.vercel.app) · [Hoja de personaje](https://cyberpunk-pbta.vercel.app/#hoja-personaje) · fuente en `web/` (`vercel.json`) |

Capítulos: `00` Sistema → `01` Crear un Cyberpunk → `02` Cyberware → `04` Cromos → `05` Chapería → `06` Glosario.

Traducción EN: fuentes en `docs/capitulos-en/` (mismos nombres de archivo). El build genera `web/data/manual.js` (ES) + `manual-en.js` (EN) con fallback por capítulo al español; el selector ES/EN de la barra superior persiste en `localStorage`. Los títulos EN que llevan arte/banner/CSS se mapean en `TITLE_EN` del build (`docs/scripts/build_web_reader.py`). La **ficha de personaje también es bilingüe** (`web/i18n.js`, display-only; storage y claves internas quedan en ES).

La versión Word se descartó: se reconstruye desde cero cuando toque.

## Web

```bash
python3 docs/scripts/build_web_reader.py                # web/data + fuente + portada
./docs/assets/fonts/install.sh                          # VT323 en el Mac, una vez
```

Original mecánico (solo lectura): `docs/ref/pbta-original.docx`. Inventario: `docs/inventario-reglas.md`.


