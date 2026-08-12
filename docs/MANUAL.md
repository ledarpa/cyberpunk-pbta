# pbta — Manual en modo texto

Fuente de trabajo para rearmar el contenido.

**Word generado:** [`../cyberpunk-pbta.docx`](../cyberpunk-pbta.docx) (raíz del proyecto).  
**`ref/`:** solo lectura — no modificar.

## Leer / editar (edición clara)

1. **[`contenido/MANUAL-completo.txt`](contenido/MANUAL-completo.txt)** — todo junto, un solo archivo  
2. Capítulos modulares: [`capitulos/`](capitulos/)

Orden:

1. Sistema  
2. Crear un Cyberpunk  
3. Cyberware — reglas y economía  
4. Catálogo de cromos  
5. Chapería — introducción  
6. Catálogo de chapería  

## Referencia (solo lectura — `docs/ref/`)

- [`ref/pbta-original.docx`](ref/pbta-original.docx)  
- Extractos de texto derivados van a [`contenido/`](contenido/), no a `ref/`

## Word generado

- [`../cyberpunk-pbta.docx`](../cyberpunk-pbta.docx) — única copia de trabajo

## Control

- [Mapa de secciones](mapa-secciones.md)  
- [Inventario de reglas](inventario-reglas.md)  

## Exportar de nuevo

```bash
python3 docs/scripts/export_texto_completo.py
```

**Nota:** Word activo = `cyberpunk-pbta.docx` en la raíz. `docs/ref/` es solo lectura.
