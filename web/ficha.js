/** Hoja de personaje — réplica de ficha horizontal.docx (3 cols apaisadas). */
(() => {
  const STORAGE_KEY = "pbta-ficha-v2";
  const LEDGER_ROWS = 31;
  const COL1_CH = 42; // ancho fijo columna identidad (ch) — mismo span que |…| Cromos (40+2)
  const PORTRAIT_W = 34; // ancho exterior (borde en col 34)
  const PORTRAIT_H = 13; // alto exterior (borde en fila 13)
  const PORTRAIT_INNER_W = 32;
  const PORTRAIT_INNER_H = PORTRAIT_H - 2; // interior 32×11
  const GHOST = "ficha-g";
  const LOGO_FALLBACK = [
    "  _____          __                  __  ",
    " / ___/  __ __  / /  ___   ____  ___ / /__",
    "/ /__   / // / / _ \\/ -_) / __/ / _ /  '_/",
    "\\___/   \\_, / /_.__/\\__/ /_/   /_//_/_/\\_\\",
    "PbtA:\\>/___/              /_/            ",
  ].join("\n");

  const STAT_VALUES = ["+3", "+2", "+1", "0", "-1", "-2", "-3"];
  const STAT_MIN = -3;
  const STAT_MAX = 3;
  const STAT_NAMES = ["en", "mc", "rc", "tm"];
  const WEAPON_LABELS = {
    pistola: "Pistola",
    escopeta: "Escopeta",
    fusil: "Fusil",
    rifle: "Rifle",
    lanzadardos: "Lanzadardos",
    "pistola impr": "Pistola Improvisada",
    "pistola improvisada": "Pistola Improvisada",
  };

  const form = document.getElementById("ficha-form");
  if (!form) return;

  // Init al final del IIFE (tras consts como WEAPON_LABELS) — ver bootSheet().

  function buildSheetHtml() {
    return `
      <div class="ficha-layout">
        <div class="ficha-col1">
          <pre class="ficha-logo" id="ficha-logo" aria-label="Cyberpunk"></pre>
          <pre class="ficha-pre ficha-pre-main" aria-label="Identidad">${colMainHtml()}</pre>
        </div>
        <pre class="ficha-pre ficha-pre-ledger" aria-label="Cromos">${ledgerHtml("cromos", "Cromos", 40)}</pre>
        <pre class="ficha-pre ficha-pre-ledger" aria-label="Chapería">${ledgerHtml("chaperia", "Chapería", 39)}</pre>
      </div>`;
  }

  /** Fila de col 1 con la misma altura que .ficha-inv-row (ledgers). */
  function col1Row(html = "") {
    return `<span class="ficha-row">${html}</span>`;
  }

  /**
   * PJ: Nombre → @Psique = filas 1–4 del inventario Cromos.
   * Cromos: blanco + título + blanco = 3 .ficha-row antes del PJ.
   * Sin \\n entre bloques: en <pre> cada \\n suma otra línea además del display:block.
   */
  function colMainHtml() {
    const identity = [
      fillField("nombre", "Nombre:\\>", "ficha-fill-nombre"),
      fillField("jugador", "Jugador:\\>"),
      professionField(),
      `<span class="ficha-id-line">@Psique:\\><span class="${GHOST}">_______</span>${psiqueBoxes()}</span>`,
    ].join("");
    const headPad = Array.from({ length: 3 }, () => col1Row()).join("");
    return `${headPad}${identity}${col1Row()}${portraitGridHtml()}${col1Row()}${atributoLines().join("")}${col1Row()}${saludLines().join("")}${col1Row()}${fillField("experiencia", "Experiencia:\\>")}${col1Row()}`;
  }

  /** Marco foto: esquinas verdes + zona clic/drag para imagen (object-fit: cover). */
  function portraitGridHtml() {
    return (
      `<span class="ficha-row ficha-portrait-host">` +
      `<span class="ficha-portrait" id="ficha-portrait" tabindex="0" aria-label="Foto del personaje">` +
      `<input class="ficha-portrait-file" type="file" accept="image/*" hidden>` +
      `<span class="ficha-portrait-media">` +
      `<img class="ficha-portrait-img" alt="">` +
      `<span class="ficha-portrait-placeholder" aria-hidden="true">Img.</span>` +
      `<button type="button" class="ficha-portrait-remove" aria-label="Eliminar foto" title="Eliminar foto">` +
      `<svg class="ficha-portrait-remove-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">` +
      `<path d="M5.5 2h5l.5 1H14v1H2V3h2.5l.5-1zM3 6h10l-.9 8H3.9L3 6zm3 1v6h1V7H6zm3 0v6h1V7H9z"/>` +
      `</svg></button>` +
      `</span>` +
      `<span class="ficha-portrait-corners" aria-hidden="true">` +
      `<span class="ficha-portrait-corner ficha-portrait-corner-tl">┌</span>` +
      `<span class="ficha-portrait-corner ficha-portrait-corner-tr">┐</span>` +
      `<span class="ficha-portrait-corner ficha-portrait-corner-bl">└</span>` +
      `<span class="ficha-portrait-corner ficha-portrait-corner-br">┘</span>` +
      `</span>` +
      `</span></span>`
    );
  }

  /**
   * Atributos:\> en la 1ª fila junto a Enlaces; el resto alineado bajo Enlaces.
   * Guiones bajos fijos (Manipulación Cognitiva → un solo _).
   */
  function atributoLines() {
    const head = "Atributos:\\>";
    const gap = "  ";
    const contPad = " ".repeat(head.length + gap.length);
    const rows = [
      ["Enlaces Neuronales", "en", 5],
      ["Manipulación Cognitiva", "mc", 1],
      ["Reacción Cinética", "rc", 6],
      ["Tejido Muscular", "tm", 8],
    ];
    return rows.map(([label, name, under], i) => {
      const prefix = i === 0 ? `${head}${gap}` : contPad;
      return col1Row(
        `${prefix}${label}<span class="${GHOST}">${"_".repeat(under)}</span>${statInput(name)}`
      );
    });
  }

  /** Salud:\> a la izquierda; todos los bloques de cuadros arrancan en la misma columna. */
  function saludLines() {
    const head = "Salud:\\>";
    const headPad = " ".repeat(head.length);
    const arrow = " -> ";
    // Referencia: fila Normal (5 cuadros) cerrando a COL1_CH → columna de inicio de cuadros
    const refLabel = "Normal";
    const refBoxesCh = 5 * 3;
    const refPad = Math.max(
      0,
      COL1_CH - head.length - [...refLabel].length - arrow.length - refBoxesCh
    );
    const boxStart = head.length + refPad + [...refLabel].length + arrow.length;

    const mk = (prefix, label, boxesHtml) => {
      const pad = Math.max(0, boxStart - prefix.length - [...label].length - arrow.length);
      return `${prefix}${" ".repeat(pad)}${label}${arrow}${boxesHtml}`;
    };
    return [
      mk(head, "Normal", tightBoxes("salud", 0, 5, false)),
      mk(headPad, "-1", tightBoxes("salud", 5, 4, true)),
      mk(headPad, "-2", tightBoxes("salud", 10, 4, true)),
      mk(headPad, "-3", tightBoxes("salud", 15, 4, true)),
      mk(headPad, "Falla Integral", tightBoxes("salud", 20, 2, true)),
    ].map((line) => col1Row(line));
  }

  function colTitle(label, width) {
    const inner = ` ${label} `;
    const room = Math.max(0, width - 2 - inner.length);
    const left = Math.floor(room / 2);
    const right = room - left;
    return `[${"·".repeat(left)}${inner}${"·".repeat(right)}]`;
  }

  function ledgerHtml(name, title, underscores) {
    const width = underscores + 2;
    const head = colTitle(title, width);
    const rows = Array.from({ length: LEDGER_ROWS }, (_, i) => invRowHtml(name, i, underscores)).join(
      "\n"
    );
    // Dos \\n iniciales: HTML ignora el primero tras <pre>; el segundo es la línea en blanco.
    return `\n\n${head}\n\n${rows}`;
  }

  function invRowHtml(ledger, idx, underscores) {
    return (
      `|<span class="ficha-inv-row" data-ledger="${ledger}" data-idx="${idx}" style="--ch:${underscores}">` +
      `<span class="ficha-ledger-wrap ficha-inv-wrap" style="--ch:${underscores}">` +
      `<span class="${GHOST} ficha-ledger-ghost" aria-hidden="true">${"_".repeat(underscores)}</span>` +
      `<span class="ficha-typed-cover" aria-hidden="true"></span>` +
      `<button type="button" class="ficha-inv-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="${ledger} ${idx + 1}"></button>` +
      `<input type="hidden" name="${ledger}-${idx}" data-ledger="${ledger}" data-inv="1" value="" style="--ch:${underscores}">` +
      `</span>` +
      `<span class="ficha-inv-menu" role="listbox" hidden></span>` +
      `</span>|`
    );
  }

  function loadLogo() {
    const el = document.getElementById("ficha-logo");
    if (!el) return;
    const paint = (text) => {
      if (window.PBTA_LOGO) window.PBTA_LOGO.paint(el, text);
      else el.textContent = text;
      fitFichaLogo();
      requestFitSheet();
    };
    fetch("data/portada-ascii.txt")
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((text) => paint(window.PBTA_LOGO ? window.PBTA_LOGO.normalize(text) : text))
      .catch(() => paint(LOGO_FALLBACK));
  }

  function fillField(name, label, lineClass = "") {
    const lineCls = lineClass ? `ficha-fill-line ${lineClass}` : "ficha-fill-line";
    return (
      `<span class="${lineCls}">` +
      `<span class="ficha-fill-label">${label}</span>` +
      `<span class="ficha-fill-track">` +
      `<span class="${GHOST} ficha-fill-ghost" aria-hidden="true">${"_".repeat(96)}</span>` +
      `<span class="ficha-typed-cover" aria-hidden="true"></span>` +
      `<input class="ficha-inline ficha-fill-input" type="text" name="${name}" autocomplete="off" spellcheck="false">` +
      `</span></span>`
    );
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  /** Profesiones del manual: h3 bajo el primer «Profesiones» del TOC. */
  function listProfessionsFromManual() {
    const toc = window.PBTA_MANUAL?.toc;
    if (!Array.isArray(toc)) return [];
    const start = toc.findIndex(
      (item) => item.level === 2 && (item.id === "profesiones" || item.title === "Profesiones")
    );
    if (start < 0) return [];
    const names = [];
    for (let i = start + 1; i < toc.length; i += 1) {
      const item = toc[i];
      if (item.level <= 2) break;
      if (item.level === 3 && item.title) names.push(String(item.title).trim());
    }
    return [...new Set(names.filter(Boolean))];
  }

  function professionField() {
    const professions = listProfessionsFromManual();
    const opts = professions
      .map(
        (p) =>
          `<button type="button" class="ficha-prof-opt" role="option" data-value="${escHtml(p)}">${escHtml(p)}</button>`
      )
      .join("");
    return (
      `<span class="ficha-fill-line ficha-prof-line">` +
      `<span class="ficha-fill-label">Profesión:\\></span>` +
      `<span class="ficha-fill-track ficha-prof-wrap">` +
      `<span class="${GHOST} ficha-fill-ghost" aria-hidden="true">${"_".repeat(96)}</span>` +
      `<span class="ficha-typed-cover" aria-hidden="true"></span>` +
      `<button type="button" class="ficha-inline ficha-prof-trigger" aria-haspopup="listbox" aria-expanded="false" aria-label="Profesión"></button>` +
      `<input type="hidden" name="profesion" value="" data-profesion="1">` +
      `</span>` +
      `<span class="ficha-prof-menu" role="listbox" hidden>${opts}</span>` +
      `</span>`
    );
  }

  /** Atributos «En la mesa» por profesión, parseados del HTML del manual. */
  function professionStatsFromManual() {
    const html = window.PBTA_MANUAL?.html;
    if (!html) return new Map();
    const map = new Map();
    const re =
      /<h3[^>]*>([^<]+)<\/h3>\s*<p class="mesa"><strong>En la mesa:<\/strong>\s*([\s\S]*?)<\/p>/gi;
    let m;
    while ((m = re.exec(html))) {
      const title = m[1].trim();
      const plain = m[2].replace(/<[^>]+>/g, " ");
      const stats = {};
      const pair = /(EN|MC|RC|TM)\s*\[\s*([+-]?\d+)\s*\]/gi;
      let p;
      while ((p = pair.exec(plain))) {
        const key = { EN: "en", MC: "mc", RC: "rc", TM: "tm" }[p[1].toUpperCase()];
        if (key) stats[key] = normalizeStat(p[2]);
      }
      if (title && stats.en != null && stats.mc != null && stats.rc != null && stats.tm != null) {
        map.set(title, stats);
      }
    }
    return map;
  }

  function applyProfessionStats(professionName) {
    const stats = professionStatsFromManual().get(professionName);
    if (!stats) return;
    for (const name of STAT_NAMES) {
      const el = form.elements.namedItem(name);
      if (!(el instanceof HTMLInputElement)) continue;
      el.value = normalizeStat(stats[name]);
      syncStatColor(el);
    }
    captureStatsBaseline();
    applyInventoryStats();
  }

  function normalizeWeaponLabel(raw) {
    const key = String(raw || "")
      .trim()
      .replace(/\.$/, "")
      .toLowerCase();
    if (!key) return "";
    if (WEAPON_LABELS[key]) return WEAPON_LABELS[key];
    return key.replace(/(^|\s)\S/g, (ch) => ch.toUpperCase());
  }

  /** Arsenal inicial por profesión: elegibles (antes del +) y fijas (después del +). */
  function professionArsenalFromManual() {
    const html = window.PBTA_MANUAL?.html;
    if (!html) return new Map();
    const map = new Map();
    const re =
      /<h3[^>]*>([^<]+)<\/h3>\s*<p class="mesa"><strong>En la mesa:<\/strong>\s*([\s\S]*?)<\/p>/gi;
    let m;
    while ((m = re.exec(html))) {
      const title = m[1].trim();
      const plain = m[2].replace(/<[^>]+>/g, " ");
      const arm = plain.match(/Arsenal inicial:\s*(.+)$/i);
      if (!arm) continue;
      const chunk = arm[1].replace(/\.\s*$/, "").trim();
      const plusParts = chunk.split(/\s*\+\s*/).map((p) => p.trim()).filter(Boolean);
      const splitList = (s) =>
        s
          .split(/\s*(?:,|\s+o\s+)\s*/i)
          .map((p) => normalizeWeaponLabel(p))
          .filter(Boolean);
      const choices = [...new Set(splitList(plusParts[0] || ""))];
      const fixed = [...new Set(plusParts.slice(1).flatMap(splitList))];
      map.set(title, { choices, fixed });
    }
    return map;
  }

  function emptyArsenalSpec() {
    return { choices: [], fixed: [] };
  }

  function arsenalSpecForProfession(professionName) {
    if (!professionName) return emptyArsenalSpec();
    return professionArsenalFromManual().get(professionName) || emptyArsenalSpec();
  }

  function currentArsenalSpec() {
    const prof = normalizeProfession(form.querySelector('input[data-profesion="1"]')?.value || "");
    return arsenalSpecForProfession(prof);
  }

  function currentArsenalWeapons() {
    return currentArsenalSpec().choices;
  }

  function normalizeArsenalChoice(raw, choices) {
    if (!choices.length) return "";
    const v = String(raw || "").trim();
    if (!v) return choices.find((w) => w.toLowerCase() === "pistola") || choices[0];
    const lower = v.toLowerCase();
    const exact = choices.find((w) => w.toLowerCase() === lower);
    if (exact) return exact;
    const contained = [...choices]
      .sort((a, b) => b.length - a.length)
      .find((w) => lower.includes(w.toLowerCase()));
    if (contained) return contained;
    return choices.find((w) => w.toLowerCase() === "pistola") || choices[0];
  }

  function weaponNameToCatalogId(name) {
    const key = String(name || "")
      .trim()
      .toLowerCase()
      .replace(/\.$/, "");
    if (!key) return "";
    if (key.includes("impr") || key.includes("improvisada")) return "pistola-improvisada";
    const map = {
      pistola: "pistola",
      escopeta: "escopeta",
      fusil: "fusil",
      rifle: "rifle",
      lanzadardos: "lanzadardos",
      lanzamisiles: "lanzamisiles",
    };
    return map[key] || "";
  }

  function isMercenario(professionName) {
    return String(professionName || "").trim().toLowerCase() === "mercenario";
  }

  function markFixedLedgerRows() {
    form.querySelectorAll('.ficha-inv-row[data-ledger="chaperia"]').forEach((row) => {
      delete row.dataset.arsenalSlot;
      delete row.dataset.arsenalFixedSlot;
      const item = window.PBTA_INV?.parseSlot(row.querySelector('input[data-inv="1"]')?.value);
      if (item?.arsenalFixed) row.dataset.arsenalFixedSlot = "1";
      else if (item?.arsenalInitial) row.dataset.arsenalSlot = "1";
    });
    form.querySelectorAll('.ficha-inv-row[data-ledger="cromos"]').forEach((row) => {
      delete row.dataset.cromoFixedSlot;
      const item = window.PBTA_INV?.parseSlot(row.querySelector('input[data-inv="1"]')?.value);
      if (item?.cromoFixed) row.dataset.cromoFixedSlot = "1";
    });
  }

  function applyStarterNeuroranura() {
    const INV = window.PBTA_INV;
    const prof = normalizeProfession(form.querySelector('input[data-profesion="1"]')?.value || "");
    if (!INV || !prof) return;
    const all = INV.collectParents(form, "cromos");
    const others = all.filter((p) => !p.cromoFixed);
    const prev = all.find((p) => p.cromoFixed && p.catalogId === "neuroranura");
    let fixed = prev ? { ...prev } : INV.createItem("neuroranura", "impro");
    if (!fixed) return;
    fixed.cromoFixed = true;
    fixed.catalogId = "neuroranura";
    if (!prev) fixed.quality = "impro";
    fixed.attached = true;
    writeLedgerParents("cromos", [fixed, ...others]);
    applyInventoryStats();
  }

  function syncNeuroranuraField() {
    const prof = normalizeProfession(form.querySelector('input[data-profesion="1"]')?.value || "");
    if (!prof) return;
    const INV = window.PBTA_INV;
    if (!INV) return;
    const has = INV.collectParents(form, "cromos").some(
      (p) => p.cromoFixed && p.catalogId === "neuroranura"
    );
    if (!has) applyStarterNeuroranura();
    else markFixedLedgerRows();
  }

  function writeLedgerParents(ledger, parents) {
    const INV = window.PBTA_INV;
    if (!INV) return;
    const lines = [];
    for (const p of parents) {
      lines.push({ type: "parent", item: p });
      for (const s of INV.listItemSubs(p)) lines.push({ type: "sub", item: s });
    }
    const rows = [...form.querySelectorAll(`.ficha-inv-row[data-ledger="${ledger}"]`)];
    for (let i = 0; i < rows.length; i += 1) {
      const input = rows[i].querySelector('input[data-inv="1"]');
      if (!input) continue;
      const line = lines[i];
      if (!line) {
        input.value = "";
        continue;
      }
      input.value = INV.serializeSlot(line.item);
    }
    INV.packLedgers(form, LEDGER_ROWS, refreshInvRow);
    markFixedLedgerRows();
  }

  function applyProfessionArsenal(professionName) {
    const INV = window.PBTA_INV;
    if (!INV) return;
    const all = INV.collectParents(form, "chaperia");
    const others = all.filter((p) => !p.arsenalInitial && !p.arsenalFixed);
    const prevArsenal = all.find((p) => p.arsenalInitial);
    const arsenal = [];

    if (isMercenario(professionName)) {
      const fixed = INV.createItem("pistola-improvisada", "impro");
      if (fixed) {
        fixed.arsenalFixed = true;
        arsenal.push(fixed);
      }
    }

    const { choices } = arsenalSpecForProfession(professionName);
    if (choices.length) {
      let weapon = null;
      if (prevArsenal?.catalogId) {
        const def = window.PBTA_CATALOGO?.get(prevArsenal.catalogId);
        const ok = def && choices.some((c) => c.toLowerCase() === def.name.toLowerCase());
        if (ok) weapon = { ...prevArsenal };
      }
      if (!weapon) {
        const pick = choices.find((w) => w.toLowerCase() === "pistola") || choices[0];
        const catalogId = weaponNameToCatalogId(pick);
        weapon = catalogId ? INV.createItem(catalogId, prevArsenal?.quality || "corr") : null;
      }
      if (weapon) {
        weapon.arsenalInitial = true;
        delete weapon.arsenalFixed;
        arsenal.push(weapon);
      }
    }

    writeLedgerParents("chaperia", [...arsenal, ...others]);
    applyInventoryStats();
  }

  function arsenalSlotInput() {
    return form.querySelector('.ficha-inv-row[data-arsenal-slot="1"] input[data-inv="1"]');
  }

  function writeArsenalInitialItem(choiceName) {
    const INV = window.PBTA_INV;
    if (!INV) return;
    const input = arsenalSlotInput();
    if (!input) return;
    const { choices } = currentArsenalSpec();
    const picked = normalizeArsenalChoice(choiceName, choices);
    const catalogId = weaponNameToCatalogId(picked);
    if (!catalogId) return;
    const prev = INV.parseSlot(input.value);
    const quality =
      prev?.catalogId === catalogId && prev.quality ? prev.quality : prev?.quality || "corr";
    const item = INV.createItem(catalogId, quality);
    if (!item) return;
    item.arsenalInitial = true;
    if (prev?.catalogId === catalogId) {
      item.accessories = [...(prev.accessories || [])];
      item.sai = [...(prev.sai || [])];
      item.modules = [...(prev.modules || [])];
      item.ballistics = [...(prev.ballistics || [])];
    }
    input.value = INV.serializeSlot(item);
    INV.packLedgers(form, LEDGER_ROWS, refreshInvRow);
    markFixedLedgerRows();
    refreshInvRow(input.closest(".ficha-inv-row"));
  }

  function syncArsenalField() {
    const INV = window.PBTA_INV;
    const input = arsenalSlotInput();
    if (!input || !INV) return;
    const { choices } = currentArsenalSpec();
    if (!choices.length) {
      const cur = INV.parseSlot(input.value);
      if (cur?.arsenalInitial) {
        input.value = "";
        refreshInvRow(input.closest(".ficha-inv-row"));
        markFixedLedgerRows();
      }
      return;
    }
    const cur = INV.parseSlot(input.value);
    if (cur?.arsenalInitial && cur.catalogId) {
      const def = window.PBTA_CATALOGO?.get(cur.catalogId);
      const name = def?.name || "";
      const ok = choices.some((c) => c.toLowerCase() === name.toLowerCase());
      if (ok) {
        refreshInvRow(input.closest(".ficha-inv-row"));
        return;
      }
    }
    writeArsenalInitialItem(choices.find((w) => w.toLowerCase() === "pistola") || choices[0]);
  }

  function applyProfessionGear(professionName) {
    applyStarterNeuroranura();
    applyProfessionArsenal(professionName);
  }

  function normalizeProfession(raw) {
    const allowed = listProfessionsFromManual();
    const s = String(raw ?? "").trim();
    return allowed.includes(s) ? s : "";
  }

  function syncProfessionField() {
    const input = form.querySelector('input[data-profesion="1"]');
    if (!input) return;
    const v = normalizeProfession(input.value);
    input.value = v;
    const line = input.closest(".ficha-prof-line");
    const wrap = input.closest(".ficha-prof-wrap");
    const trigger = wrap?.querySelector(".ficha-prof-trigger");
    const ghost = wrap?.querySelector(".ficha-fill-ghost");
    const menu = line?.querySelector(".ficha-prof-menu");
    if (trigger) trigger.textContent = v;
    menu?.querySelectorAll(".ficha-prof-opt").forEach((opt) => {
      opt.setAttribute("aria-selected", String(opt.dataset.value === v));
    });
    if (ghost) {
      ghost.textContent = "_".repeat(96);
      ghost.style.marginLeft = "0";
    }
    if (wrap) setTypedCover(wrap, [...v].length);
  }

  function closeAllFichaMenus() {
    form.querySelectorAll(".ficha-stat-wrap").forEach((wrap) => {
      const menu = wrap.querySelector(".ficha-stat-menu");
      const trigger = wrap.querySelector(".ficha-stat-trigger");
      if (menu) menu.hidden = true;
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
    form.querySelectorAll(".ficha-prof-line").forEach((line) => {
      const menu = line.querySelector(".ficha-prof-menu");
      const trigger = line.querySelector(".ficha-prof-trigger");
      if (menu) menu.hidden = true;
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
    hideSaludDetachMenu();
    window.PBTA_INV?.closeMenus(form);
  }

  function listDetachableCromos() {
    const INV = window.PBTA_INV;
    if (!INV) return [];
    return INV.collectParents(form, "cromos").filter((p) => {
      const def = INV.defOf(p);
      if (!def || def.column !== "cromos") return false;
      if (def.attachable === false) return false;
      return p.attached !== false;
    });
  }

  function detachCromoById(itemId) {
    const INV = window.PBTA_INV;
    if (!INV || !itemId) return false;
    for (const row of form.querySelectorAll('.ficha-inv-row[data-ledger="cromos"]')) {
      if (row.classList.contains("is-sub") || row.classList.contains("is-psique-load")) continue;
      const input = row.querySelector('input[data-inv="1"]');
      const item = INV.parseSlot(input?.value);
      if (!item || item.id !== itemId) continue;
      item.attached = false;
      input.value = INV.serializeSlot(item);
      INV.packLedgers(form, LEDGER_ROWS, refreshInvRow);
      applyInventoryStats();
      saveSheet();
      return true;
    }
    return false;
  }

  let saludDetachAnchor = null;
  let saludDetachHideTimer = 0;

  function ensureSaludDetachMenu() {
    let menu = form.querySelector(".ficha-salud-detach-menu");
    if (menu) return menu;
    menu = document.createElement("span");
    menu.className = "ficha-salud-detach-menu";
    menu.setAttribute("role", "listbox");
    menu.hidden = true;
    form.appendChild(menu);
    menu.addEventListener("pointerenter", () => {
      clearTimeout(saludDetachHideTimer);
    });
    menu.addEventListener("pointerleave", () => {
      scheduleHideSaludDetachMenu();
    });
    menu.addEventListener("click", (ev) => {
      const btn = ev.target.closest("[data-detach-id]");
      if (!btn || !menu.contains(btn)) return;
      ev.preventDefault();
      ev.stopPropagation();
      const id = btn.dataset.detachId;
      if (id) detachCromoById(id);
      hideSaludDetachMenu();
    });
    return menu;
  }

  function hideSaludDetachMenu() {
    clearTimeout(saludDetachHideTimer);
    saludDetachAnchor = null;
    const menu = form.querySelector(".ficha-salud-detach-menu");
    if (menu) menu.hidden = true;
  }

  function scheduleHideSaludDetachMenu(ms = 180) {
    clearTimeout(saludDetachHideTimer);
    saludDetachHideTimer = setTimeout(() => {
      hideSaludDetachMenu();
    }, ms);
  }

  function placeSaludDetachMenu(menu, anchor) {
    const rect = anchor.getBoundingClientRect();
    const width = Math.min(260, window.innerWidth - 16);
    let left = Math.round(rect.left);
    if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const openUp = spaceBelow < 120 && rect.top > spaceBelow;
    menu.style.position = "fixed";
    menu.style.left = `${left}px`;
    menu.style.width = `${width}px`;
    menu.style.zIndex = "130";
    if (openUp) {
      menu.style.top = "auto";
      menu.style.bottom = `${Math.round(window.innerHeight - rect.top + 4)}px`;
    } else {
      menu.style.bottom = "auto";
      menu.style.top = `${Math.round(rect.bottom + 4)}px`;
    }
  }

  function showSaludDetachMenu(anchor) {
    if (!(anchor instanceof Element)) return;
    if (anchor.dataset.group !== "salud" || anchor.dataset.star !== "true") return;
    if (anchor.getAttribute("aria-pressed") !== "true") return;

    const INV = window.PBTA_INV;
    const menu = ensureSaludDetachMenu();
    clearTimeout(saludDetachHideTimer);
    saludDetachAnchor = anchor;

    const items = listDetachableCromos();
    const head = `<div class="ficha-salud-detach-sec">Desacoplar cromo</div>`;
    let body = "";
    if (!items.length) {
      body = `<div class="ficha-salud-detach-empty">No hay cromos acoplados</div>`;
    } else {
      body = items
        .map((it) => {
          const label = INV?.formatItem(it, 28) || INV?.defOf(it)?.name || "Cromo";
          return (
            `<button type="button" class="ficha-salud-detach-opt" role="option" data-detach-id="${escHtml(it.id)}">` +
            `${escHtml(label)}</button>`
          );
        })
        .join("");
    }
    menu.innerHTML = head + body;
    placeSaludDetachMenu(menu, anchor);
    menu.hidden = false;
  }

  function bindSaludDetachMenu() {
    ensureSaludDetachMenu();
    form.addEventListener("pointerover", (ev) => {
      const t = ev.target;
      if (!(t instanceof Element)) return;
      const box = t.closest('.ficha-box[data-group="salud"][data-star="true"]');
      if (!box || !form.contains(box)) return;
      if (box.getAttribute("aria-pressed") !== "true") return;
      showSaludDetachMenu(box);
    });
    form.addEventListener("pointerout", (ev) => {
      const t = ev.target;
      if (!(t instanceof Element)) return;
      const box = t.closest('.ficha-box[data-group="salud"][data-star="true"]');
      if (!box) return;
      const to = ev.relatedTarget;
      const menu = form.querySelector(".ficha-salud-detach-menu");
      if (to instanceof Node && (box.contains(to) || menu?.contains(to))) return;
      scheduleHideSaludDetachMenu();
    });
  }

  function bindProfessionPicker() {
    const line = form.querySelector(".ficha-prof-line");
    if (!line) return;
    const wrap = line.querySelector(".ficha-prof-wrap");
    const trigger = line.querySelector(".ficha-prof-trigger");
    const menu = line.querySelector(".ficha-prof-menu");
    const input = line.querySelector('input[data-profesion="1"]');
    if (!wrap || !trigger || !menu || !input) return;

    trigger.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const open = menu.hidden;
      closeAllFichaMenus();
      if (open) {
        menu.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
      }
    });

    menu.querySelectorAll(".ficha-prof-opt").forEach((opt) => {
      opt.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        input.value = opt.dataset.value || "";
        syncProfessionField();
        applyProfessionStats(input.value);
        applyProfessionGear(input.value);
        closeAllFichaMenus();
        saveSheet();
      });
    });
  }

  /**
   * Quita _ verdes bajo lo tipeado (incluye espacios).
   * Recorta el ghost + marginLeft (el cover opaco solo es respaldo: el texto
   * del ghost gana el stacking al cover en algunos motores).
   */
  function setTypedCover(track, typedLen) {
    if (!track) return;
    const n = Math.max(0, typedLen);
    const ghost = track.querySelector(".ficha-fill-ghost, .ficha-ledger-ghost");
    const cover = track.querySelector(".ficha-typed-cover");
    if (ghost) {
      let max = Number.parseInt(ghost.dataset.fullLen || "", 10);
      if (!Number.isFinite(max) || max <= 0) {
        max =
          Number.parseInt(String(track.style.getPropertyValue("--ch") || "").trim(), 10) ||
          [...ghost.textContent].length ||
          96;
        ghost.dataset.fullLen = String(max);
      }
      ghost.textContent = "_".repeat(Math.max(0, max - n));
      ghost.style.marginLeft = n > 0 ? `${n}ch` : "0px";
    }
    if (cover) cover.style.width = n > 0 ? `${n}ch` : "0px";
  }

  function syncTypedMask(input) {
    if (!(input instanceof HTMLInputElement)) return;
    if (input.type === "hidden" || input.dataset.arsenal || input.dataset.stat || input.dataset.profesion || input.dataset.inv) {
      return;
    }
    if (!input.classList.contains("ficha-fill-input")) return;
    const track = input.closest(".ficha-fill-track");
    if (!track) return;
    setTypedCover(track, [...input.value].length);
  }

  function syncAllTypedMasks() {
    form.querySelectorAll("input.ficha-fill-input").forEach((el) => syncTypedMask(el));
  }

  function statInput(name) {
    const opts = STAT_VALUES.map((v) => {
      const sign =
        v === "0" ? "zero" : v.startsWith("-") ? "neg" : "pos";
      const sel = v === "0" ? ' aria-selected="true"' : "";
      return `<button type="button" class="ficha-stat-opt ficha-stat-${sign}" role="option" data-value="${v}"${sel}>${v}</button>`;
    }).join("");
    return (
      `[<span class="ficha-stat-wrap">` +
      `<button type="button" class="ficha-inline ficha-stat-trigger ficha-stat-zero" data-stat-trigger="${name}" aria-haspopup="listbox" aria-expanded="false" aria-label="${name}">0</button>` +
      `<input type="hidden" name="${name}" value="0" data-stat="1">` +
      `<span class="ficha-stat-menu" role="listbox" hidden>${opts}</span>` +
      `</span>]`
    );
  }

  function normalizeStat(raw) {
    const s = String(raw ?? "").trim();
    if (STAT_VALUES.includes(s)) return s;
    const n = Number.parseInt(s.replace(/^\+/, ""), 10);
    if (!Number.isFinite(n)) return "0";
    const clamped = Math.max(STAT_MIN, Math.min(STAT_MAX, n));
    return clamped > 0 ? `+${clamped}` : String(clamped);
  }

  function clampStatN(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return 0;
    return Math.max(STAT_MIN, Math.min(STAT_MAX, v));
  }

  function syncStatColor(el) {
    if (!(el instanceof HTMLInputElement) || !el.dataset.stat) return;
    const v = normalizeStat(el.value);
    el.value = v;
    const wrap = el.closest(".ficha-stat-wrap");
    const trigger = wrap?.querySelector(".ficha-stat-trigger");
    if (trigger) {
      trigger.textContent = v;
      trigger.classList.remove("ficha-stat-pos", "ficha-stat-neg", "ficha-stat-zero");
      if (v === "0") trigger.classList.add("ficha-stat-zero");
      else if (v.startsWith("-")) trigger.classList.add("ficha-stat-neg");
      else trigger.classList.add("ficha-stat-pos");
    }
    wrap?.querySelectorAll(".ficha-stat-opt").forEach((opt) => {
      opt.setAttribute("aria-selected", String(opt.dataset.value === v));
    });
  }

  function syncAllStatColors() {
    form.querySelectorAll('input[data-stat="1"]').forEach((el) => syncStatColor(el));
  }

  function closeAllStatMenus() {
    closeAllFichaMenus();
  }

  function bindStatPickers() {
    form.querySelectorAll(".ficha-stat-wrap").forEach((wrap) => {
      const trigger = wrap.querySelector(".ficha-stat-trigger");
      const menu = wrap.querySelector(".ficha-stat-menu");
      const input = wrap.querySelector('input[data-stat="1"]');
      if (!trigger || !menu || !input) return;

      trigger.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const open = menu.hidden;
        closeAllFichaMenus();
        if (open) {
          menu.hidden = false;
          trigger.setAttribute("aria-expanded", "true");
        }
      });

      menu.querySelectorAll(".ficha-stat-opt").forEach((opt) => {
        opt.addEventListener("click", (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          const picked = normalizeStat(opt.dataset.value || "0");
          const bonus = sumInventoryStats();
          const INV = window.PBTA_INV;
          const penalty = INV?.sumPsiqueLoadPenalties(form) || { en: 0, mc: 0, rc: 0, tm: 0 };
          const pickedN = Number.parseInt(picked.replace(/^\+/, ""), 10) || 0;
          const cappedBonus = Math.min(Number(bonus[input.name] || 0), STAT_MAX);
          const baseN = clampStatN(pickedN - cappedBonus - Number(penalty[input.name] || 0));
          statsBaseline[input.name] = normalizeStat(baseN);
          applyInventoryStats();
          closeAllFichaMenus();
          saveSheet();
        });
      });
    });

    document.addEventListener("click", (ev) => {
      if (
        ev.target instanceof Node &&
        form.contains(ev.target) &&
        (ev.target.closest(".ficha-stat-wrap") ||
          ev.target.closest(".ficha-prof-line") ||
          ev.target.closest(".ficha-inv-row") ||
          ev.target.closest('.ficha-box[data-group="salud"]') ||
          ev.target.closest(".ficha-salud-detach-menu"))
      ) {
        return;
      }
      closeAllFichaMenus();
    });
  }

  function psiqueBoxes() {
    return (
      Array.from({ length: 3 }, (_, i) => boxBtn(`psique-${i}`, "psique", "wide", false)).join("") +
      boxBtn("psique-3", "psique", "wide", true) +
      boxBtn("psique-4", "psique", "wide", true)
    );
  }

  function tightBoxes(group, start, count, starFirst) {
    let html = "";
    let idx = start;
    if (starFirst) {
      html += boxBtn(`${group}-${idx}`, group, "tight", true);
      idx += 1;
    }
    for (let i = 0; i < count; i += 1) {
      html += boxBtn(`${group}-${idx}`, group, "tight", false);
      idx += 1;
    }
    return html;
  }

  function boxBtn(name, group, size, starred) {
    const inner = boxInnerHtml(false, size === "wide", !!starred);
    const starAttr = starred ? ` data-star="true"` : "";
    return `<button type="button" class="ficha-box ficha-box-${size}" name="${name}" data-group="${group}" data-size="${size}"${starAttr} aria-pressed="false" aria-label="Casilla">[<span class="ficha-box-inner">${inner}</span>]</button>`;
  }

  function boxInnerHtml(on, wide, starred) {
    if (on) return wide ? "&nbsp;×&nbsp;" : "×";
    if (starred) {
      return wide
        ? `<span class="${GHOST}"> *</span><span class="${GHOST}"> </span>`
        : `<span class="${GHOST}">*</span>`;
    }
    return wide ? "&nbsp;&nbsp;&nbsp;" : "&nbsp;";
  }

  function paintBox(btn, on) {
    btn.setAttribute("aria-pressed", String(!!on));
    const inner = btn.querySelector(".ficha-box-inner");
    if (!inner) return;
    inner.innerHTML = boxInnerHtml(!!on, btn.dataset.size === "wide", btn.dataset.star === "true");
  }

  /** Última fila de ledger / Experiencia fuera del borde inferior de la página. */
  function contentPastPageBottom(page) {
    const limit = page.getBoundingClientRect().bottom - 1;
    const past = (el) => !!el && el.getBoundingClientRect().bottom > limit;
    for (const label of ["Cromos", "Chapería"]) {
      const pre = form.querySelector(`.ficha-pre-ledger[aria-label="${label}"]`);
      const wraps = pre?.querySelectorAll(".ficha-ledger-wrap");
      if (past(wraps?.[wraps.length - 1])) return true;
    }
    const exp = form.querySelector('input[name="experiencia"]')?.closest(".ficha-fill-line");
    return past(exp);
  }

  function ledgersOverflow() {
    const ledgers = form.querySelectorAll(".ficha-pre-ledger");
    for (const el of ledgers) {
      if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2) {
        return true;
      }
    }
    return false;
  }

  function applySheetSize(size) {
    form.style.fontSize = `${size}px`;
    form.style.lineHeight = "1.03125";
    form.style.setProperty("--ficha-lh", "1.03125");
    fitFichaLogo();
  }

  function fitSheet() {
    const page = form.closest(".ficha-page");
    const panel = document.getElementById("ficha-panel");
    if (!page || !panel || panel.hidden) return;
    if (panel.clientWidth < 40 || panel.clientHeight < 40) return;

    const pad = 4;
    const availW = Math.max(200, panel.clientWidth - pad);
    const availH = Math.max(200, panel.clientHeight - pad);
    page.style.width = `${Math.floor(availW)}px`;
    page.style.height = `${Math.floor(availH)}px`;

    const marginPx = Math.max(4, Math.min(12, Math.min(availW, availH) * 0.012));
    const marginBottom = Math.max(2, Math.floor(marginPx * 0.35));
    form.style.padding = `${marginPx}px ${marginPx}px ${marginBottom}px`;
    const gap = Math.max(4, Math.min(10, availW * 0.008));
    form.style.setProperty("--ficha-gap", `${gap}px`);

    const innerH = availH - marginPx - marginBottom;
    const innerW = availW - marginPx * 2;
    const colW = (innerW - gap * 2) / 3;

    form.style.fontSize = "100px";
    form.style.lineHeight = "1.03125";
    form.style.setProperty("--ficha-lh", "1.03125");
    const probe = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;font:inherit;";
    probe.textContent = "0000000000";
    form.appendChild(probe);
    const chPerEm = probe.getBoundingClientRect().width / 10 / 100;
    form.removeChild(probe);

    // título + blancos + filas; el freno fino es contentPastPageBottom
    const sizeByWidth = colW / (42 * Math.max(0.45, chPerEm));
    const sizeByHeight = innerH / ((LEDGER_ROWS + 3) * 1.03125);
    let size = Math.min(sizeByWidth, sizeByHeight);
    size = Math.max(12, Math.min(28, size));
    size = Math.round(size * 2) / 2;
    applySheetSize(size);

    const overflows = () => ledgersOverflow() || contentPastPageBottom(page);

    for (let i = 0; i < 12; i += 1) {
      if (!overflows()) break;
      size = Math.round((size - 0.5) * 2) / 2;
      if (size < 12) break;
      applySheetSize(size);
    }

    // Subir de a 0.5px solo si sigue cabiendo tras alinear Experiencia
    for (let i = 0; i < 24; i += 1) {
      const next = Math.round((size + 0.5) * 2) / 2;
      if (next > 28) break;
      applySheetSize(next);
      if (overflows()) {
        applySheetSize(size);
        break;
      }
      size = next;
    }

    // Encoger si sigue desbordando
    for (let i = 0; i < 16; i += 1) {
      if (!overflows()) break;
      size = Math.round((size - 0.5) * 2) / 2;
      if (size < 12) break;
      applySheetSize(size);
    }
  }

  /** Refit tras fuentes/layout (evita última línea cortada al recargar). */
  function requestFitSheet() {
    const run = () => {
      const panel = document.getElementById("ficha-panel");
      if (!panel || panel.hidden) return;
      fitSheet();
    };
    requestAnimationFrame(() => {
      run();
      requestAnimationFrame(() => {
        run();
        const ready = document.fonts?.ready;
        if (ready) ready.then(run).catch(() => {});
        setTimeout(run, 40);
        setTimeout(run, 160);
        setTimeout(run, 400);
      });
    });
  }

  window.PBTA_FICHA = { fit: requestFitSheet };

  function fitLogoPrompt() {
    const logoEl = document.getElementById("ficha-logo");
    if (logoEl && window.PBTA_LOGO) window.PBTA_LOGO.fitPrompt(logoEl);
  }

  /**
   * Logo Cyberpunk: misma tipografía/espaciado que el título del manual.
   * Escala solo por ancho de columna; overflow visible (no se recorta).
   */
  function fitFichaLogo() {
    const logo = document.getElementById("ficha-logo");
    const col = logo?.closest(".ficha-col1");
    if (!logo || !col) return;
    const maxW = Math.max(48, col.clientWidth || 0);
    if (window.PBTA_LOGO?.fitToWidth) {
      window.PBTA_LOGO.fitToWidth(logo, maxW, 40);
    } else {
      fitLogoPrompt();
    }
  }

  function bindPortrait() {
    const host = form.querySelector(".ficha-portrait");
    const fileInput = form.querySelector(".ficha-portrait-file");
    if (!host || !fileInput) return;

    const applyFile = (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPortraitImage(reader.result);
          saveSheet();
        }
      };
      reader.readAsDataURL(file);
    };

    const removeBtn = form.querySelector(".ficha-portrait-remove");

    host.addEventListener("click", (ev) => {
      if (ev.target.closest(".ficha-portrait-remove")) return;
      fileInput.click();
    });
    host.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        fileInput.click();
      }
    });
    fileInput.addEventListener("change", () => {
      const file = fileInput.files?.[0];
      if (file) applyFile(file);
      fileInput.value = "";
    });

    host.addEventListener("dragenter", (ev) => {
      ev.preventDefault();
      host.classList.add("ficha-portrait--dragover");
    });
    host.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      host.classList.add("ficha-portrait--dragover");
    });
    host.addEventListener("dragleave", (ev) => {
      ev.preventDefault();
      if (!host.contains(ev.relatedTarget)) host.classList.remove("ficha-portrait--dragover");
    });
    host.addEventListener("drop", (ev) => {
      ev.preventDefault();
      host.classList.remove("ficha-portrait--dragover");
      const file = ev.dataTransfer?.files?.[0];
      if (file) applyFile(file);
    });

    removeBtn?.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      setPortraitImage("");
      saveSheet();
    });
  }

  function setPortraitImage(dataUrl) {
    const host = form.querySelector(".ficha-portrait");
    const img = form.querySelector(".ficha-portrait-img");
    if (!host || !img) return;
    if (dataUrl) {
      img.src = dataUrl;
      host.classList.add("ficha-portrait--has-image");
    } else {
      img.removeAttribute("src");
      host.classList.remove("ficha-portrait--has-image");
    }
  }

  function bindSheet() {
    form.querySelectorAll(".ficha-box[data-group]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const group = btn.dataset.group;
        const wasOff = btn.getAttribute("aria-pressed") !== "true";
        if (group === "psique" || group === "salud") {
          toggleSequentialBox(group, btn);
          if (group === "psique") ensurePsiqueMinimum(countPsiqueLoads());
        } else {
          paintBox(btn, btn.getAttribute("aria-pressed") !== "true");
        }
        // Al marcar una X amarilla de Salud → menú para desacoplar cromo
        if (
          group === "salud" &&
          wasOff &&
          btn.dataset.star === "true" &&
          btn.getAttribute("aria-pressed") === "true"
        ) {
          showSaludDetachMenu(btn);
        } else if (group === "salud" && btn.getAttribute("aria-pressed") !== "true") {
          hideSaludDetachMenu();
        }
        saveSheet();
      });
    });
  }

  /**
   * Pista secuencial (psique / salud):
   * - marcar: siguiente vacía (izq→der, arriba→abajo = orden DOM)
   * - liberar: última marcada (der→izq, abajo→arriba = orden DOM inverso)
   */
  function toggleSequentialBox(group, btn) {
    const boxes = [...form.querySelectorAll(`.ficha-box[data-group="${group}"]`)];
    const idx = boxes.indexOf(btn);
    if (idx < 0) return;

    const on = boxes.map((b) => b.getAttribute("aria-pressed") === "true");
    const filled = on.lastIndexOf(true);
    const next = filled + 1;
    const psiqueMin = group === "psique" ? countPsiqueLoads() : 0;

    if (on[idx]) {
      if (idx !== filled) return;
      // No se puede liberar una casilla exigida por sobrecarga activa
      if (group === "psique" && filled + 1 <= psiqueMin) return;
      paintBox(btn, false);
      return;
    }

    if (idx !== next) return;
    paintBox(btn, true);
  }

  /** Corrige huecos al cargar: prefijo continuo de marcas. */
  function normalizeSequential(group) {
    const boxes = [...form.querySelectorAll(`.ficha-box[data-group="${group}"]`)];
    let seenOff = false;
    boxes.forEach((btn) => {
      const marked = btn.getAttribute("aria-pressed") === "true";
      if (seenOff || !marked) {
        seenOff = true;
        paintBox(btn, false);
      } else {
        paintBox(btn, true);
      }
    });
  }

  /** Primeras N casillas @Psique marcadas sí o sí (N = sobrecargas activas). */
  function ensurePsiqueMinimum(minCount) {
    const boxes = [...form.querySelectorAll('.ficha-box[data-group="psique"]')];
    const need = Math.max(0, Math.min(Number(minCount) || 0, boxes.length));
    boxes.forEach((btn, i) => {
      if (i < need) paintBox(btn, true);
    });
    normalizeSequential("psique");
    // Tras normalizar, reasegurar el prefijo (por si había huecos previos)
    boxes.forEach((btn, i) => {
      if (i < need) paintBox(btn, true);
    });
  }

  function collect() {
    const data = {};
    for (const el of form.elements) {
      if (!el.name || el.classList.contains("ficha-box") || el.dataset.ledger) continue;
      data[el.name] = el.value;
    }
    for (const col of ["cromos", "chaperia"]) {
      data[col] = [...form.querySelectorAll(`input[data-ledger="${col}"]`)].map((i) => i.value).join("\n");
    }
    data.statsBaseline = { ...statsBaseline };
    data.psique = [...form.querySelectorAll('.ficha-box[data-group="psique"]')].map(
      (b) => b.getAttribute("aria-pressed") === "true"
    );
    data.salud = [...form.querySelectorAll('.ficha-box[data-group="salud"]')].map(
      (b) => b.getAttribute("aria-pressed") === "true"
    );
    const portraitImg = form.querySelector(".ficha-portrait-img");
    if (portraitImg?.getAttribute("src")) data.portrait = portraitImg.getAttribute("src");
    return data;
  }

  function saveSheet() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collect()));
    } catch {
      /* ignore */
    }
  }

  function loadSheet() {
    let data;
    try {
      data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      data = null;
    }
    if (!data) return false;
    for (const el of form.elements) {
      if (!el.name || el.classList.contains("ficha-box") || el.dataset.ledger) continue;
      if (data[el.name] != null) el.value = data[el.name];
    }
    for (const col of ["cromos", "chaperia"]) {
      if (data[col] == null) continue;
      const lines = String(data[col]).split("\n");
      form.querySelectorAll(`input[data-ledger="${col}"]`).forEach((el, i) => {
        el.value = lines[i] || "";
      });
    }
    applyBoxes("psique", data.psique);
    applyBoxes("salud", data.salud);
    normalizeSequential("psique");
    normalizeSequential("salud");
    if (data.portrait) setPortraitImage(data.portrait);
    if (data.statsBaseline && typeof data.statsBaseline === "object") {
      statsBaseline = {
        en: normalizeStat(data.statsBaseline.en),
        mc: normalizeStat(data.statsBaseline.mc),
        rc: normalizeStat(data.statsBaseline.rc),
        tm: normalizeStat(data.statsBaseline.tm),
      };
    } else {
      STAT_NAMES.forEach((name) => {
        const el = form.elements.namedItem(name);
        if (el && "value" in el) el.value = normalizeStat(el.value);
      });
      captureStatsBaseline();
    }
    const prof = form.querySelector('input[data-profesion="1"]');
    if (prof) prof.value = normalizeProfession(prof.value);
    syncAllTypedMasks();
    syncProfessionField();
    syncArsenalField();
    syncNeuroranuraField();
    refreshAllInvRows();
    applyInventoryStats();
    return true;
  }

  function applyBoxes(group, states) {
    if (!Array.isArray(states)) return;
    form.querySelectorAll(`.ficha-box[data-group="${group}"]`).forEach((btn, i) => {
      paintBox(btn, !!states[i]);
    });
  }

  /** Stats base (profesión / manual) sin bonos de inventario acoplado. */
  let statsBaseline = { en: "0", mc: "0", rc: "0", tm: "0" };

  function captureStatsBaseline() {
    const next = {};
    for (const name of STAT_NAMES) {
      const el = form.elements.namedItem(name);
      next[name] = el && "value" in el ? normalizeStat(el.value) : "0";
    }
    statsBaseline = next;
  }

  function refreshInvRow(row) {
    if (!row) return;
    const INV = window.PBTA_INV;
    const input = row.querySelector('input[data-inv="1"]');
    const trigger = row.querySelector(".ficha-inv-trigger");
    const wrap = row.querySelector(".ficha-inv-wrap");
    const ghost = wrap?.querySelector(".ficha-ledger-ghost");
    const maxCh = Number.parseInt(String(input?.style.getPropertyValue("--ch") || "40"), 10) || 40;
    const item = INV?.parseSlot(input?.value);
    const isSub =
      item?.kind === "sub" || item?.kind === "psique-load" || row.classList.contains("is-sub");
    row.classList.toggle("is-sub", !!isSub);
    row.classList.toggle("is-psique-load", item?.kind === "psique-load");
    if (isSub) {
      if (item?.parentId) row.dataset.parentId = item.parentId;
      if (item?.subKind) row.dataset.subKind = item.subKind;
      else if (!row.dataset.subKind) row.dataset.subKind = "";
    } else {
      delete row.dataset.parentId;
      delete row.dataset.subKind;
    }

    // Subítems: label con espacios iniciales ("  + nombre"); white-space:pre en CSS
    const label =
      item &&
      (item.catalogId ||
        item.kind === "sub" ||
        item.kind === "psique-load" ||
        (item.label || "").trim())
        ? INV.formatItem(item, maxCh)
        : "";
    if (trigger) {
      trigger.disabled = !!(item?.arsenalFixed);
      trigger.textContent = label;
      // NBSP de respaldo si el motor colapsa espacios normales
      if (isSub && label.startsWith(" ")) {
        trigger.textContent = label.replace(/^ +/, (m) => "\u00A0".repeat(m.length));
      }
    }
    if (ghost) {
      ghost.dataset.fullLen = String(maxCh);
      ghost.textContent = "_".repeat(maxCh);
      ghost.style.marginLeft = "0";
    }
    if (wrap) {
      wrap.style.minWidth = `${maxCh}ch`;
      setTypedCover(wrap, [...label].length);
    }
  }

  function refreshAllInvRows() {
    const INV = window.PBTA_INV;
    if (INV?.packLedgers) INV.packLedgers(form, LEDGER_ROWS, refreshInvRow);
    else form.querySelectorAll(".ficha-inv-row").forEach((row) => refreshInvRow(row));
  }

  function sumInventoryStats() {
    const INV = window.PBTA_INV;
    const sum = { en: 0, mc: 0, rc: 0, tm: 0 };
    if (!INV) return sum;
    form.querySelectorAll('input[data-inv="1"]').forEach((el) => {
      const item = INV.parseSlot(el.value);
      if (!item?.catalogId || item.kind === "sub" || item.kind === "psique-load") return;
      const st = INV.statsFor(item);
      for (const k of STAT_NAMES) sum[k] += Number(st[k] || 0);
    });
    return sum;
  }

  function countPsiqueLoads() {
    const INV = window.PBTA_INV;
    if (!INV) return 0;
    return INV.collectPsiqueLoads(form).length;
  }

  function canAssignPsiqueStat(formRef, item, statKey) {
    const INV = window.PBTA_INV;
    if (!INV || !STAT_NAMES.includes(statKey)) return false;
    const loads = INV.collectPsiqueLoads(formRef).filter((l) => l.loadIndex !== item.loadIndex);
    const pen = { en: 0, mc: 0, rc: 0, tm: 0 };
    for (const l of loads) {
      if (STAT_NAMES.includes(l.stat)) pen[l.stat] -= 1;
    }
    pen[statKey] -= 1;
    const bonus = sumInventoryStats();
    const base =
      Number.parseInt(String(statsBaseline[statKey] || "0").replace(/^\+/, ""), 10) || 0;
    const cappedBonus = Math.min(Number(bonus[statKey] || 0), STAT_MAX);
    return base + cappedBonus + pen[statKey] >= STAT_MIN;
  }

  function applyInventoryStats() {
    const INV = window.PBTA_INV;
    const bonus = sumInventoryStats();
    const penalty = INV?.sumPsiqueLoadPenalties(form) || { en: 0, mc: 0, rc: 0, tm: 0 };
    ensurePsiqueMinimum(countPsiqueLoads());

    for (const name of STAT_NAMES) {
      const el = form.elements.namedItem(name);
      if (!(el instanceof HTMLInputElement)) continue;
      const base = Number.parseInt(String(statsBaseline[name] || "0").replace(/^\+/, ""), 10) || 0;
      const cappedBonus = Math.min(Number(bonus[name] || 0), STAT_MAX);
      const total = clampStatN(base + cappedBonus + Number(penalty[name] || 0));
      el.value = normalizeStat(total);
      syncStatColor(el);
    }
  }

  function setPortraitMetrics() {
    form.style.setProperty("--portrait-w", String(PORTRAIT_W));
    form.style.setProperty("--portrait-h", String(PORTRAIT_H));
    form.style.setProperty("--portrait-inner-w", String(PORTRAIT_INNER_W));
    form.style.setProperty("--portrait-inner-h", String(PORTRAIT_INNER_H));
  }

  function bootSheet() {
    form.innerHTML = buildSheetHtml();
    setPortraitMetrics();
    loadLogo();
    bindSheet();
    bindSaludDetachMenu();
    bindPortrait();
    bindStatPickers();
    bindProfessionPicker();
    window.PBTA_INV?.bindInventory({
      form,
      saveSheet,
      applyInventoryStats,
      refreshInvRow,
      closeAllFichaMenus,
      LEDGER_ROWS,
      getArsenalChoices: () => currentArsenalWeapons(),
      setArsenalChoice: (name) => {
        writeArsenalInitialItem(name);
        saveSheet();
      },
      confirmDelete: (label) =>
        window.confirm(
          `¿Eliminar «${label}»?\n\nAdvertencia: se quitarán bonos EN/MC/RC/TM y efectos de ficha ligados a este elemento.`
        ),
      canAssignPsiqueStat,
    });
    const loaded = loadSheet();
    syncAllTypedMasks();
    syncAllStatColors();
    syncProfessionField();
    syncArsenalField();
    syncNeuroranuraField();
    refreshAllInvRows();
    markFixedLedgerRows();
    if (!loaded) {
      captureStatsBaseline();
      applyInventoryStats();
    }
    form.addEventListener("input", (ev) => {
      if (ev.target instanceof HTMLInputElement) syncTypedMask(ev.target);
      saveSheet();
    });
    form.addEventListener("change", saveSheet);
    requestFitSheet();
    window.addEventListener("resize", fitSheet);
    window.addEventListener("pbta-ficha-show", () => requestFitSheet());
    if ("ResizeObserver" in window) {
      const panel = document.getElementById("ficha-panel");
      if (panel) {
        let roTimer = 0;
        new ResizeObserver(() => {
          clearTimeout(roTimer);
          roTimer = setTimeout(fitSheet, 16);
        }).observe(panel);
      }
    }
  }

  bootSheet();
})();
