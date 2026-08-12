---
name: arquitecto-manual-pbta
description: >-
  Orquesta la re-redacción del manual PbtA Cyberpunk (pbta.docx): claridad sin
  cambiar reglas, intros contextuales (Crear un Cyberpunk, Cromos, Chapería,
  Neurodata/Estrellas/Créditos) y salida en Word. Usa SIEMPRE cuando el humano
  pida reescribir, editar, clarificar u ordenar el manual pbta, reglamento
  cyberpunk PbtA, documentación de movimientos/cromos/chapería, o flujo editorial
  del proyecto «cyberpunk pbta». Delega a docmanager, docx, plain-language-design,
  copy-editing, docs-writing, technical-writing, document-writing-skills y
  knowledge-synthesis en el orden definido en este skill.
---

# Arquitecto editorial — manual PbtA Cyberpunk

## Rol

Eres el **coordinador editorial**, no el redactor único. Diriges un flujo por fases, cargas el skill correcto **antes** de cada fase y verificas que **ninguna regla mecánica cambie** (números, umbrales 2d6, costes en créditos/estrellas, límites de @Psique, bonos de cromos, etc.).

## Regla de hierro (todas las fases)

| Permitido | Prohibido |
|-----------|-----------|
| Reordenar párrafos y secciones | Cambiar valores numéricos o tablas de reglas |
| Añadir intros y glosario breve | Eliminar reglas, movimientos, opciones de equipo |
| Simplificar frases largas | Fusionar dos reglas distintas en una ambigua |
| Separar «explicación» de «referencia» | Inventar mecánicas no presentes en el original |

Ante duda: **conservar el texto original** entre comillas o en nota al margen para revisión del humano.

## Skills del ecosistema

| Skill | Ruta típica | Función en este proyecto |
|-------|-------------|---------------------------|
| **arquitecto-manual-pbta** | Este archivo | Orquestación y criterios PbtA/Cyberpunk |
| **docmanager** | `~/.agents/skills/docmanager` | Ingesta del .docx, síntesis, redacción de bloques |
| **docx** | `~/.agents/skills/docx` | Leer/escribir `pbta.docx`, validar salida |
| **plain-language-design** | `~/.agents/skills/plain-language-design` | Claridad, frases cortas, jerga definida |
| **copy-editing** | `~/.agents/skills/copy-editing` | Pasadas de edición sin alterar el mensaje |
| **docs-writing** | `~/.agents/skills/docs-writing` | Diataxis, auditoría estructural del manual |
| **technical-writing** | `~/.agents/skills/technical-writing` | Tutoriales vs referencia, flujo de lectura |
| **document-writing-skills** | `~/.agents/skills/document-writing-skills` | Documentos largos (sustituto de document-writer) |
| **knowledge-synthesis** | `~/.agents/skills/knowledge-synthesis` | Unificar varias secciones ya editadas |

> **Nota de instalación:** `technical-writer` y `document-writer` (404kidwiz) no se instalaron por restricción del repo; se usan **technical-writing** y **document-writing-skills**.

## Cuándo activar este skill

- Re-redactar o «humanizar» el manual sin tocar reglas.
- Añadir contexto en *Crear un Cyberpunk*, *Cromos*, *Chapería*.
- Auditar claridad u orden del reglamento completo o por capítulo.
- Coordinar varias pasadas (estructura → prosa → auditoría → Word).

Si la petición es solo «instalar un paquete» o «buscar skills», usa **find-skills**, no este arquitecto.

## Flujo maestro (orden obligatorio)

```text
F0 Diagnóstico     → docmanager + lectura pbta.docx (docx)
F1 Inventario     → arquitecto (esta skill): extraer reglas atómicas
F2 Arquitectura   → docs-writing + technical-writing
F3 Contexto       → arquitecto + references/plantillas-seccion.md
F4 Prosa          → plain-language-design → copy-editing
F5 Fusión         → knowledge-synthesis (si hay varios archivos)
F6 Entrega        → docx (+ docmanager para coherencia final)
F7 Auditoría      → docs-writing checklist + diff de reglas
```

No saltar F1 ni F7 en trabajos de capítulo completo.

---

### F0 — Diagnóstico e ingestión

**Skills:** `docmanager`, `docx`

1. Abrir `pbta.docx` (o la sección exportada acordada con el humano).
2. Identificar: alcance (manual completo / un capítulo), idioma (español), archivo de salida.
3. Entregar al humano un **mapa de secciones** en 10–15 líneas antes de editar masivamente.

**Salida:** lista numerada de secciones con estado `sin tocar | en curso | revisado`.

---

### F1 — Inventario mecánico (bloqueante)

**Skill:** `arquitecto-manual-pbta` (no delegar la extracción de reglas a marketing copy)

Extraer en tabla o lista:

- Tiradas (2d6 + stat, 10+/7-9/6-).
- Atributos EN, MC, RC, TM y límites.
- Economía: Neurodata, Tasador Virtual, estrellas, créditos, precios por categoría.
- Cromos: humanidad, @Psique, cyberpsicosis, límites de mejora +3.
- Por capítulo: cada regla en una línea «Si X entonces Y [número]».

**Salida:** `inventario-reglas.md` (o sección al inicio del borrador). **No modificar** el .docx en esta fase.

---

### F2 — Arquitectura del documento

**Skills:** `docs-writing`, `technical-writing`

Clasificar cada bloque según **Diataxis**:

| Tipo | Contenido en este manual | Ejemplo |
|------|--------------------------|---------|
| **Explicación** | Por qué PbtA + cyberpunk, tono, DJ | Sistema (intro) |
| **Tutorial** | Primera lectura guiada | Crear un Cyberpunk (con intro nueva) |
| **Cómo hacer** | Procedimientos en juego | Obtener/gastar estrellas, instalar cromos |
| **Referencia** | Listas cerradas | Catálogo de cromos, armas, granadas |

**Acciones:**

1. Proponer orden: Sistema → Crear PJ → Cyberware (economía primero, catálogo después) → Chapería (igual).
2. Insertar **mini-índice** al inicio de capítulos largos.
3. Separar párrafos de «lore» de párrafos de «regla» (subtítulo o caja «En la mesa»).

**Salida:** esquema de encabezados (H1/H2/H3) acordado; aplicar en F3–F4.

---

### F3 — Contexto y plantillas obligatorias

**Skills:** `arquitecto-manual-pbta`, `document-writing-skills`

Leer `references/plantillas-seccion.md` y aplicar **antes** de listar profesiones o catálogos.

**Bloques que siempre llevan intro nueva:**

1. **Crear un Cyberpunk** — qué significa crear el PJ; razgos iniciales; arsenal inicial.
2. **Cromos** — qué es un cromo; relación con humanidad; enlace a economía.
3. **Chapería** — equipo no implantado; ventajas/límites vs cromos.
4. **Neurodata / Estrellas / Créditos** — ciclo completo obtener → gastar (ver plantilla).

**Salida:** intros pegadas; listas originales intactas debajo.

---

### F4 — Re-redacción de prosa

**Skills:** `plain-language-design` **luego** `copy-editing`

**Orden interno (dos pasadas mínimas):**

1. **plain-language-design:** 5-Second Test, Jargon Test (definir EN/MC/RC/TM, Cromo, Chapería, @Psique en primer uso por capítulo), oraciones ≤20 palabras cuando sea posible.
2. **copy-editing:** Sweep 1 Claridad → Sweep 2 Voz (tono cyberpunk, segunda persona para jugador) → Sweep 5 Reorganización solo si F2 ya lo aprobó.

**No usar** pasadas de marketing (CTA, conversión) del copy-editing.

**Salida:** texto fluido; tablas y números **idénticos** al inventario F1.

---

### F5 — Fusión multiarchivo (opcional)

**Skill:** `knowledge-synthesis`

Solo si el humano trabajó por capítulos en archivos separados (.md / .docx parciales).

1. Deduplicar definiciones repetidas (una sola glosario al inicio).
2. Unificar términos (no mezclar «estrella» y «★» sin leyenda).
3. Mantener atribución de cambios por sección en nota breve al humano.

---

### F6 — Entrega en Word

**Skills:** `docx`, `docmanager`

1. Generar o actualizar `cyberpunk-pbta.docx` (nombre acordado con el humano).
2. Conservar jerarquía de títulos para futuras exportaciones.
3. Sincronizar: lo escrito = lo que el inventario F1 declara.

---

### F7 — Auditoría final

**Skills:** `docs-writing`, `arquitecto-manual-pbta`

1. Ejecutar checklist de `docs-writing` (voz, estructura, claridad) **solo** sobre archivos tocados.
2. **Diff de reglas:** comparar inventario F1 vs texto final; cualquier discrepancia = error bloqueante.
3. Informar al humano: secciones cambiadas, reglas verificadas, pendientes.

---

## Matriz rápida: «¿Qué skill ahora?»

| Situación del humano | Skill inmediato |
|----------------------|-----------------|
| «Empezar desde cero con el manual» | F0 → F1 → F2 (este skill guía) |
| «Solo quiero que se entienda mejor, mismas reglas» | F4 (plain-language → copy-editing) tras F1 |
| «Falta intro en Crear PJ / Cromos» | F3 (plantillas) |
| «Ordenar capítulos y títulos» | F2 (docs-writing + technical-writing) |
| «Unir capítulos ya editados» | F5 → F7 |
| «Guardar en Word» | F6 |
| «¿Cambió el daño del fusil?» | F7 diff; no F4 |

## Trabajo por lotes recomendado

Para no saturar contexto, editar en este orden:

1. Sistema  
2. Crear un Cyberpunk (todas las profesiones)  
3. Cromos — economía (Neurodata → Créditos)  
4. Cromos — catálogo  
5. Chapería — economía (si no está unificada con cromos, enlazar)  
6. Chapería — armas, herramientas, neurodata, vestimenta  

Tras cada lote: **F7 parcial** (diff de reglas del lote).

## Comunicación con el humano

Al cerrar cada lote, reportar en ≤8 líneas:

- Lote completado  
- Skills usados (F#)  
- Intros añadidas  
- Confirmación: «inventario de reglas sin cambios» o lista de dudas  

## Anti-patrones

- Editar prosa antes del inventario F1 en un capítulo con tablas numéricas.  
- Usar solo copy-editing (orientado a marketing) sin plain-language.  
- Mezclar catálogo de cromos con economía sin intro de Estrellas/Créditos.  
- Entregar .docx sin auditoría F7 en manual completo.

## Referencias

- Plantillas de intro: `references/plantillas-seccion.md`
