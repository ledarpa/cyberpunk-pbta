/** Hoja de personaje — réplica de ficha horizontal.docx (3 cols apaisadas). */
(() => {
  const STORAGE_KEY = "pbta-ficha-v2";
  const LEDGER_ROWS = 30; // +1 título de columna = 31 líneas
  const GHOST = "ficha-g";
  const LOGO_FALLBACK = [
    "  _____          __                  __  ",
    " / ___/  __ __  / /  ___   ____  ___ / /__",
    "/ /__   / // / / _ \\/ -_) / __/ / _ /  '_/",
    "\\___/   \\_, / /_.__/\\__/ /_/   /_//_/_/\\_\\",
    "PbtA:\\>/___/              /_/            ",
  ].join("\n");

  const STAT_VALUES = ["+5", "+4", "+3", "+2", "+1", "0", "-1", "-2", "-3", "-4", "-5"];
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
        <pre class="ficha-pre ficha-pre-main" aria-label="Identidad">${colMainHtml()}</pre>
        <pre class="ficha-pre ficha-pre-ledger" aria-label="Cromos">${ledgerHtml("cromos", "Cromos", 40)}</pre>
        <pre class="ficha-pre ficha-pre-ledger" aria-label="Chapería">${ledgerHtml("chaperia", "Chapería", 39)}</pre>
      </div>`;
  }

  function colMainHtml() {
    const portraitMid = Array.from({ length: 5 }, () =>
      `│${" ".repeat(35)}│`
    ).join("\n");
    const portrait = [
      `┌${" ".repeat(35)}┐`,
      portraitMid,
      `└${" ".repeat(35)}┘`,
    ].join("\n");
    // Sin \\n entre fill-lines: en <pre> el salto + display:flex duplica la línea.
    const identity = [
      fillField("nombre", "Nombre:\\>"),
      fillField("jugador", "Jugador:\\>"),
      professionField(),
      `<span class="ficha-id-line">@Psique:\\><span class="${GHOST}">__</span>${psiqueBoxes()}</span>`,
    ].join("");
    return [
      `<span class="ficha-logo" id="ficha-logo"></span>${identity}`,
      "",
      `<span class="ficha-boxdraw">${portrait}</span>`,
      "",
      "Atributos:\\>",
      `        Enlaces Neuronales<span class="${GHOST}">_____</span>${statInput("en")}`,
      `        Manipulación Cognitiva<span class="${GHOST}">_</span>${statInput("mc")}`,
      `        Reacción Cinética<span class="${GHOST}">______</span>${statInput("rc")}`,
      `        Tejido Muscular<span class="${GHOST}">________</span>${statInput("tm")}`,
      "",
      `Salud:\\>    Normal -&gt; ${tightBoxes("salud", 0, 5, false)}`,
      `                -1 -&gt; ${tightBoxes("salud", 5, 4, true)}`,
      `                -2 -&gt; ${tightBoxes("salud", 10, 4, true)}`,
      `                -3 -&gt; ${tightBoxes("salud", 15, 4, true)}`,
      `    Falla Integral -&gt; ${tightBoxes("salud", 20, 2, true)}`,
      "",
      "Experiencia:\\>",
      fillField("experiencia", ""),
    ].join("\n");
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
    return `${head}\n\n\n${rows}`;
  }

  function invRowHtml(ledger, idx, underscores) {
    const arsenalAttr = ledger === "chaperia" && idx === 0 ? ' data-arsenal-slot="1"' : "";
    return (
      `|<span class="ficha-inv-row" data-ledger="${ledger}" data-idx="${idx}"${arsenalAttr} style="--ch:${underscores}">` +
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
      fitSheet();
    };
    fetch("data/portada-ascii.txt")
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((text) => paint(window.PBTA_LOGO ? window.PBTA_LOGO.normalize(text) : text))
      .catch(() => paint(LOGO_FALLBACK));
  }

  function fillField(name, label) {
    return (
      `<span class="ficha-fill-line">` +
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

  function arsenalSlotInput() {
    return form.querySelector('.ficha-inv-row[data-arsenal-slot="1"] input[data-inv="1"]');
  }

  function clearLegacyArsenalFixedRows() {
    const INV = window.PBTA_INV;
    if (!INV) return;
    form.querySelectorAll('input[data-inv="1"][data-ledger="chaperia"]').forEach((el) => {
      if (el.closest('[data-arsenal-slot="1"]')) return;
      const item = INV.parseSlot(el.value);
      if (item?.arsenalFixed) {
        el.value = "";
        refreshInvRow(el.closest(".ficha-inv-row"));
      }
    });
  }

  function writeArsenalInitialItem(choiceName) {
    const INV = window.PBTA_INV;
    if (!INV) return;
    const input = arsenalSlotInput();
    if (!input) return;
    const { choices, fixed } = currentArsenalSpec();
    const picked = normalizeArsenalChoice(choiceName, choices);
    const catalogId = weaponNameToCatalogId(picked);
    if (!catalogId) {
      input.value = "";
      refreshInvRow(input.closest(".ficha-inv-row"));
      return;
    }
    const prev = INV.parseSlot(input.value);
    const quality =
      prev?.catalogId === catalogId && prev.quality ? prev.quality : "corr";
    const item = INV.createItem(catalogId, quality);
    if (!item) return;
    item.arsenalInitial = true;
    item.arsenalFixedLabels = fixed.slice();
    if (prev?.catalogId === catalogId) {
      item.accessories = [...(prev.accessories || [])];
      item.sai = [...(prev.sai || [])];
      item.modules = [...(prev.modules || [])];
    }
    input.value = INV.serializeSlot(item);
    refreshInvRow(input.closest(".ficha-inv-row"));
  }

  function applyProfessionArsenal(professionName) {
    const { choices } = arsenalSpecForProfession(professionName);
    clearLegacyArsenalFixedRows();
    const pick = choices.find((w) => w.toLowerCase() === "pistola") || choices[0] || "";
    writeArsenalInitialItem(pick);
  }

  function syncArsenalField() {
    const INV = window.PBTA_INV;
    const input = arsenalSlotInput();
    if (!input || !INV) return;
    const { choices, fixed } = currentArsenalSpec();
    if (!choices.length) {
      const cur = INV.parseSlot(input.value);
      if (cur?.arsenalInitial) {
        input.value = "";
        refreshInvRow(input.closest(".ficha-inv-row"));
      }
      return;
    }
    const cur = INV.parseSlot(input.value);
    if (cur?.arsenalInitial && cur.catalogId) {
      const def = window.PBTA_CATALOGO?.get(cur.catalogId);
      const name = def?.name || "";
      const ok = choices.some((c) => c.toLowerCase() === name.toLowerCase());
      if (ok) {
        cur.arsenalFixedLabels = fixed.slice();
        input.value = INV.serializeSlot(cur);
        refreshInvRow(input.closest(".ficha-inv-row"));
        return;
      }
    }
    writeArsenalInitialItem(choices.find((w) => w.toLowerCase() === "pistola") || choices[0]);
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
    window.PBTA_INV?.closeMenus(form);
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
        applyProfessionArsenal(input.value);
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
    if (
      !input.classList.contains("ficha-fill-input") &&
      !input.classList.contains("ficha-ledger-inline")
    ) {
      return;
    }
    const track = input.closest(".ficha-fill-track, .ficha-ledger-wrap");
    if (!track) return;
    setTypedCover(track, [...input.value].length);
  }

  function syncAllTypedMasks() {
    form
      .querySelectorAll("input.ficha-fill-input, input.ficha-ledger-inline")
      .forEach((el) => syncTypedMask(el));
  }

  function fieldInput(name, ch, extraClass = "") {
    return `<input class="ficha-inline ${extraClass}" type="text" name="${name}" size="${ch}" style="--ch:${ch}" autocomplete="off" spellcheck="false">`;
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
    if (Number.isFinite(n) && n >= -5 && n <= 5) return n > 0 ? `+${n}` : String(n);
    return "0";
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
          const pickedN = Number.parseInt(picked.replace(/^\+/, ""), 10) || 0;
          const baseN = Math.max(-5, Math.min(5, pickedN - (bonus[input.name] || 0)));
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
          ev.target.closest(".ficha-inv-row"))
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

  function fitSheet() {
    const page = form.closest(".ficha-page");
    const panel = document.getElementById("ficha-panel");
    if (!page || !panel || panel.hidden) return;

    const pad = 8;
    const availW = Math.max(200, panel.clientWidth - pad);
    const availH = Math.max(200, panel.clientHeight - pad);
    page.style.width = `${Math.floor(availW)}px`;
    page.style.height = `${Math.floor(availH)}px`;

    const marginPx = Math.max(8, Math.min(18, Math.min(availW, availH) * 0.018));
    form.style.padding = `${marginPx}px`;
    const gap = Math.max(6, Math.min(14, availW * 0.012));
    form.style.setProperty("--ficha-gap", `${gap}px`);

    const innerH = availH - marginPx * 2;
    const innerW = availW - marginPx * 2;
    const colW = (innerW - gap * 2) / 3;

    form.style.fontSize = "100px";
    form.style.lineHeight = "1.03125";
    const probe = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText =
      "position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;font:inherit;";
    probe.textContent = "0000000000";
    form.appendChild(probe);
    const chPerEm = probe.getBoundingClientRect().width / 10 / 100;
    form.removeChild(probe);

    // título + 2 líneas en blanco + 30 filas ledger
    const sizeByWidth = colW / (42 * Math.max(0.45, chPerEm));
    const sizeByHeight = innerH / ((LEDGER_ROWS + 3) * 1.03125);
    let size = Math.min(sizeByWidth, sizeByHeight);
    size = Math.max(12, Math.min(28, size));
    size = Math.round(size * 2) / 2; // evita subpíxeles que deforman la raya
    form.style.fontSize = `${size}px`;
    form.style.lineHeight = "1.03125";

    const ledgers = form.querySelectorAll(".ficha-pre-ledger");
    for (let i = 0; i < 8; i += 1) {
      let overflow = false;
      ledgers.forEach((el) => {
        if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2) {
          overflow = true;
        }
      });
      if (!overflow) break;
      size = Math.round(size * 0.98 * 2) / 2;
      form.style.fontSize = `${size}px`;
    }

    fitLogoPrompt();
    alignMainColumnBottom();
    requestAnimationFrame(() => {
      alignMainColumnBottom();
      requestAnimationFrame(alignMainColumnBottom);
    });
  }

  function fitLogoPrompt() {
    const logoEl = document.getElementById("ficha-logo");
    if (logoEl && window.PBTA_LOGO) window.PBTA_LOGO.fitPrompt(logoEl);
  }

  /**
   * Alinea la raya de Experiencia con la última fila real de Cromos
   * (no el alto del <pre>, que está estirado al 100%).
   */
  function alignMainColumnBottom() {
    const logo = document.getElementById("ficha-logo");
    const expLine = form.querySelector('input[name="experiencia"]')?.closest(".ficha-fill-line");
    const cromos = form.querySelector('.ficha-pre-ledger[aria-label="Cromos"]');
    const wraps = cromos?.querySelectorAll(".ficha-ledger-wrap");
    const lastLedger = wraps?.[wraps.length - 1];
    if (!logo || !expLine || !lastLedger) return;

    logo.style.marginBottom = "0px";
    void logo.offsetHeight;

    const ledgerBottom = lastLedger.getBoundingClientRect().bottom;
    const expBottom = expLine.getBoundingClientRect().bottom;
    const delta = ledgerBottom - expBottom;

    // delta > 0 → Experiencia más arriba → agrandar aire bajo Cyberpunk
    // delta < 0 → Experiencia más abajo → reducir aire (mín. 0)
    logo.style.marginBottom = `${Math.max(0, delta)}px`;
  }

  function bindSheet() {
    form.querySelectorAll(".ficha-box[data-group]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const group = btn.dataset.group;
        if (group === "psique" || group === "salud") {
          toggleSequentialBox(group, btn);
        } else {
          paintBox(btn, btn.getAttribute("aria-pressed") !== "true");
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

    if (on[idx]) {
      if (idx !== filled) return;
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
    const label =
      item && (item.catalogId || (item.label || "").trim())
        ? item.catalogId
          ? INV.formatItem(item, maxCh)
          : String(item.label || "").slice(0, maxCh)
        : "";
    if (trigger) trigger.textContent = label;
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
    form.querySelectorAll(".ficha-inv-row").forEach((row) => refreshInvRow(row));
  }

  function sumInventoryStats() {
    const INV = window.PBTA_INV;
    const sum = { en: 0, mc: 0, rc: 0, tm: 0 };
    if (!INV) return sum;
    form.querySelectorAll('input[data-inv="1"]').forEach((el) => {
      const item = INV.parseSlot(el.value);
      if (!item?.catalogId) return;
      const st = INV.statsFor(item);
      for (const k of STAT_NAMES) sum[k] += Number(st[k] || 0);
    });
    return sum;
  }

  function applyInventoryStats() {
    const bonus = sumInventoryStats();
    for (const name of STAT_NAMES) {
      const el = form.elements.namedItem(name);
      if (!(el instanceof HTMLInputElement)) continue;
      const base = Number.parseInt(String(statsBaseline[name] || "0").replace(/^\+/, ""), 10) || 0;
      const total = Math.max(-5, Math.min(5, base + bonus[name]));
      el.value = normalizeStat(total);
      syncStatColor(el);
    }
  }

  function bootSheet() {
    form.innerHTML = buildSheetHtml();
    loadLogo();
    bindSheet();
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
    });
    const loaded = loadSheet();
    syncAllTypedMasks();
    syncAllStatColors();
    syncProfessionField();
    syncArsenalField();
    refreshAllInvRows();
    if (!loaded) {
      captureStatsBaseline();
      applyInventoryStats();
    }
    form.addEventListener("input", (ev) => {
      if (ev.target instanceof HTMLInputElement) syncTypedMask(ev.target);
      saveSheet();
    });
    form.addEventListener("change", saveSheet);
    requestAnimationFrame(fitSheet);
    window.addEventListener("resize", fitSheet);
    if ("ResizeObserver" in window) {
      const panel = document.getElementById("ficha-panel");
      if (panel) new ResizeObserver(fitSheet).observe(panel);
    }
  }

  bootSheet();
})();
