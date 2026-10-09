# PbtA — Manual Cyberpunk

Una salida web desde una sola prosa:

| | Dónde |
|--|--------|
| **Fuente** | `docs/capitulos/` |
| **Web** | [cyberpunk-pbta.vercel.app](https://cyberpunk-pbta.vercel.app) · Hoja de personaje · fuente en `web/` (`vercel.json`) |
| **PDF** | `docs/pdf/manual-es.pdf` + `docs/pdf/ficha.pdf` — diseño en `docs/pdf/theme.typ` / `docs/pdf/ficha.typ`, generados desde los mismos capítulos md |

Capítulos: `00` Sistema → `01` Crear un Cyberpunk → `02` Cyberware → `04` Cromos → `05` Chapería → `06` Glosario (el `03` no existe).

Traducción EN: fuentes en `docs/capitulos-en/` (mismos nombres de archivo). El build genera `web/data/manual.js` (ES) + `manual-en.js` (EN) con fallback por capítulo al español; el selector ES/EN de la barra superior persiste en `localStorage`. Los títulos EN que llevan arte/banner/CSS se mapean en `TITLE_EN` del build (`docs/scripts/build_web_reader.py`). La **ficha de personaje también es bilingüe** (`web/i18n.js`, display-only; storage y claves internas quedan en ES).

Versión anterior del proyecto (era Word: original mecánico, ficha, borrador y bake-off de ejemplos, memoria de traducción EN): `docs/master.old.1.zip`.

## Web

```bash
python3 docs/scripts/build_web_reader.py                # web/data + fuente + portada
./docs/assets/fonts/install.sh                          # VT323 en el Mac, una vez
```

## PDF (Typst)

```bash
python3 docs/scripts/build_pdf_typst.py                 # docs/pdf/manual-es.pdf + ficha.pdf
```

Convierte `docs/capitulos/` → `docs/.generated/pdf/manual.typ` (ignorado por git) y compila con typst (brew).
El diseño vive en `docs/pdf/theme.typ` (manual) y `docs/pdf/ficha.typ` (ficha): terminal fósforo del lector
adaptado a papel (VT323 en títulos/tablas/chips, cuerpo serif, arte pixel de catálogo en monocromo junto a
cada entrada). Ojo: varios «png» del lector son JPEG de extensión mentirosa; el build los normaliza al
convertirlos a PNG monocromo en `docs/.generated/pdf/assets/` porque typst decodifica por extensión.

## Dev y QA

```bash
./scripts/dev.sh                    # vercel dev :9876 (API real + .env.local)
node scripts/capture.js             # pasada visual → shots/ (portada, capítulos, ficha)
python3 docs/scripts/optimize_assets.py   # comprime web/assets/ (pngquant/oxipng)
```

Cuentas y despliegue de auth: `docs/ACCOUNTS.md` · `docs/AUTH_DEPLOY.md` · esquema en `sql/schema.sql`.
Original mecánico y materiales de la era Word: `docs/master.old.1.zip`. Inventario: `docs/inventario-reglas.md`.
