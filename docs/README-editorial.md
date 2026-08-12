# Editorial — manual pbta

Orquestación: skill **`arquitecto-manual-pbta`**.

## Estado actual

- **Contenido:** [`capitulos/`](capitulos/) y [`contenido/MANUAL-completo.txt`](contenido/MANUAL-completo.txt)
- **Word generado:** [`../cyberpunk-pbta.docx`](../cyberpunk-pbta.docx) (solo en la raíz del proyecto)
- **`ref/`:** solo lectura — no modificar

## Entregables

| Artefacto | Ubicación |
|-----------|-----------|
| Word activo | [`../cyberpunk-pbta.docx`](../cyberpunk-pbta.docx) |
| Manual texto | [`contenido/MANUAL-completo.txt`](contenido/MANUAL-completo.txt) |
| Capítulos Markdown | [`capitulos/`](capitulos/) |
| Referencia (solo lectura) | [`ref/pbta-original.docx`](ref/pbta-original.docx) |
| Inventario reglas | [inventario-reglas.md](inventario-reglas.md) |

## Generar Word

```bash
python3 docs/scripts/build_pbta_docx.py
```

Salida: **`cyberpunk-pbta.docx`** en la raíz (VT323 / MS-DOS). No escribe en `ref/`.

**Referencia de formato/layout:** [`ref/formato.docx`](ref/formato.docx) (solo lectura). El Word activo parte de ese contenido; márgenes/saltos de sección manuales viven ahí.

**Anti-huérfano (default en estilos + builder):**
- Títulos 1–4, Mesa, barras de capítulo: `keepNext` + `keepLines`
- Normal / listas: `widowControl`
- Párrafo antes de tabla: `keepNext`
- Filas de tabla: `cantSplit`

**Índice automático:** estilos nativos `Heading 1–4` / `Normal` / `List Bullet` (Word ES: Título 1–3…). Insertar → Tabla de contenido.

```bash
./docs/assets/fonts/install.sh   # si falta VT323
```

## Exportar texto

```bash
python3 docs/scripts/export_texto_completo.py
```

Escribe solo en `docs/contenido/`. Puede **leer** `docs/ref/`; no lo modifica.
