/** Inventario click-select para Cromos / Chapería. */
window.PBTA_INV = (() => {
  const CAT = () => window.PBTA_CATALOGO;
  const STATS = ["en", "mc", "rc", "tm"];

  const esc = (s) => window.PBTA_LOGO.esc(s);

  function uid() {
    return `i${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }

  function defOf(item) {
    return item?.catalogId ? CAT()?.get(item.catalogId) : null;
  }

  function qualityLabel(q, def) {
    return def?.qualityLabels?.[q] || CAT()?.Q_LABEL?.[q] || q || "";
  }

  function qualityShort(q, def) {
    return def?.qualityShort?.[q] || CAT()?.Q_SHORT?.[q] || qualityLabel(q, def);
  }

  function qualityTag(q, def) {
    return def?.qualityTags?.[q] || CAT()?.Q_TAG?.[q] || String(q || "").toLowerCase();
  }

  function saiCap(def, quality) {
    if (!def?.saiSlots) return 0;
    return def.saiSlots[quality] ?? 0;
  }

  function moduleCap(def, quality) {
    if (!def?.moduleSlots) return 0;
    return def.moduleSlots[quality] ?? 0;
  }

  function neurodataCap(def, quality) {
    if (!def?.neurodataSlots) return 0;
    return def.neurodataSlots[quality] ?? 0;
  }

  function statPoolCap(def, quality) {
    if (!def?.statPoolByQuality) return 0;
    return def.statPoolByQuality[quality] ?? 0;
  }

  function statPoolKeys(def) {
    return def?.statPoolKeys?.length ? def.statPoolKeys : STATS;
  }

  function fixedStatsFor(item, def) {
    const q = item?.quality || "impro";
    return { ...(def?.statsByQuality?.[q] || {}) };
  }

  function moduleStatsFor(item, def) {
    const out = {};
    for (const id of item?.modules || []) {
      const mod = (def?.modules || []).find((m) => m.id === id);
      const st = mod?.stats;
      if (!st || typeof st !== "object") continue;
      for (const [k, v] of Object.entries(st)) {
        const n = Number(v) || 0;
        if (n) out[k] = (Number(out[k]) || 0) + n;
      }
    }
    return out;
  }

  function ensureAppliedStats(item, def) {
    if (!def?.statPoolByQuality) {
      item.appliedStats = {};
      return;
    }
    if (!item.appliedStats || typeof item.appliedStats !== "object") {
      item.appliedStats = { en: 0, mc: 0, rc: 0, tm: 0 };
    }
    clampAppliedStats(item, def);
  }

  function appliedStatTotal(item, def) {
    const keys = statPoolKeys(def);
    const applied = item?.appliedStats || {};
    return keys.reduce((sum, k) => sum + (Number(applied[k]) || 0), 0);
  }

  function clampAppliedStats(item, def) {
    if (!def?.statPoolByQuality) return;
    const cap = statPoolCap(def, item.quality);
    const keys = statPoolKeys(def);
    if (!item.appliedStats || typeof item.appliedStats !== "object") {
      item.appliedStats = { en: 0, mc: 0, rc: 0, tm: 0 };
    }
    let total = appliedStatTotal(item, def);
    while (total > cap) {
      let pick = keys[0];
      let max = -1;
      for (const k of keys) {
        const v = Number(item.appliedStats[k]) || 0;
        if (v > max) {
          max = v;
          pick = k;
        }
      }
      if (max <= 0) break;
      item.appliedStats[pick] = max - 1;
      total -= 1;
    }
  }

  function formatStatDelta(v) {
    const n = Number(v) || 0;
    if (!n) return "+0";
    return n > 0 ? `+${n}` : String(n);
  }

  function buildStatsMenuHtml(item, def) {
    if (!def || def.column !== "cromos") return "";
    const q = item.quality || "impro";
    const fixed = fixedStatsFor(item, def);
    const modSt = moduleStatsFor(item, def);
    const poolCap = statPoolCap(def, q);
    const poolKeys = statPoolKeys(def);

    const fixedHtml = STATS.filter((k) => Number(fixed[k]) || Number(modSt[k]))
      .map((k) => {
        const n = (Number(fixed[k]) || 0) + (Number(modSt[k]) || 0);
        return (
          `<div class="ficha-inv-stat-fixed">` +
          `<span class="ficha-inv-stat-tag">[${k.toUpperCase()}]</span>` +
          `<span class="ficha-inv-stat-val">${esc(formatStatDelta(n))}</span>` +
          `</div>`
        );
      })
      .join("");

    let poolHtml = "";
    if (poolCap > 0 && poolKeys.length) {
      ensureAppliedStats(item, def);
      const applied = item.appliedStats || {};
      const total = appliedStatTotal(item, def);
      const atCap = total >= poolCap;
      poolHtml = poolKeys
        .map((k) => {
          const val = Number(applied[k]) || 0;
          return (
            `<div class="ficha-inv-stat-row">` +
            `<span class="ficha-inv-stat-tag">[${k.toUpperCase()}]</span>` +
            `<button type="button" class="ficha-inv-stat-btn" data-stat-dn="${k}" aria-label="Menos ${k.toUpperCase()}" ${val <= 0 ? "disabled" : ""}>▼</button>` +
            `<span class="ficha-inv-stat-val">${esc(formatStatDelta(val))}</span>` +
            `<button type="button" class="ficha-inv-stat-btn" data-stat-up="${k}" aria-label="Más ${k.toUpperCase()}" ${atCap ? "disabled" : ""}>▲</button>` +
            `</div>`
          );
        })
        .join("");
      poolHtml += `<div class="ficha-inv-stat-pool">${total}/${poolCap} puntos</div>`;
    }

    if (!fixedHtml && !poolHtml) return "";
    return `<div class="ficha-inv-sec">Bonos</div>${fixedHtml}${poolHtml}`;
  }

  function normalizeNeurodataEntry(entry) {
    if (!entry) return null;
    if (typeof entry === "string") return { id: entry, note: "" };
    if (typeof entry === "object" && entry.id) {
      return { id: String(entry.id), note: String(entry.note || "").trim() };
    }
    return null;
  }

  function normalizeNeurodata(arr) {
    return (arr || []).map(normalizeNeurodataEntry).filter(Boolean);
  }

  function neurodataDisplayName(opt, note) {
    const base = String(opt?.name || "").trim();
    const n = String(note || "").trim();
    return n ? `${base} ${n}` : base;
  }

  const GRENADE_CHARGES = 8;

  function isGrenadeDef(def) {
    return !!(def && /^granada-/.test(def.id || ""));
  }

  function isGrenadeItem(item) {
    return isGrenadeDef(defOf(item));
  }

  function defaultCharges() {
    return Array.from({ length: GRENADE_CHARGES }, () => true);
  }

  function ensureCharges(item) {
    if (!isGrenadeItem(item)) return null;
    if (!Array.isArray(item.charges) || item.charges.length !== GRENADE_CHARGES) {
      item.charges = defaultCharges();
    } else {
      item.charges = item.charges.map((c) => !!c);
    }
    return item.charges;
  }

  function createItem(catalogId, quality) {
    const def = CAT()?.get(catalogId);
    if (!def) return null;
    const q = def.lockedQuality || quality || (def.hasQuality === false ? null : "impro");
    const item = {
      id: uid(),
      catalogId,
      quality: q,
      accessories: [],
      sai: [],
      modules: [],
      ballistics: [],
      neurodata: [],
      attached: def.column === "cromos" && def.attachable !== false,
      appliedStats: {},
      arsenalFixed: false,
      cromoFixed: false,
      arsenalChoice: false,
    };
    if (isGrenadeDef(def)) item.charges = defaultCharges();
    return item;
  }

  function neurochipSubtypeName(name) {
    return String(name || "")
      .replace(/^Neurochip\s*[—–-]\s*/i, "")
      .trim();
  }

  function itemCoreNames(def) {
    const fullName = String(def?.name || "").trim();
    const shortName = String(def?.short || "").trim();
    if ((def?.id || "").startsWith("neurochip-")) {
      const chip = neurochipSubtypeName(fullName) || fullName;
      const names = [chip];
      if (fullName !== chip) names.push(fullName);
      return names;
    }
    const names = [fullName];
    if (shortName && shortName !== fullName) names.push(shortName);
    return names;
  }

  /**
   * Una línea: texto completo si cabe; si no, resume (calidad corta → short → …).
   */
  function formatItem(item, maxCh) {
    const lim = maxCh || 40;

    if (item?.kind === "psique-load") {
      const stat = String(item.stat || "en").toUpperCase();
      const label = `  Degeneración neural: [${stat}]`;
      if (label.length <= lim) return label;
      return `${label.slice(0, Math.max(1, lim - 1))}…`;
    }

    if (item?.subKind === "charges") {
      return "";
    }

    if (item?.kind === "sub") {
      let label = String(item.label || "");
      if (label.length > lim) label = `${label.slice(0, lim - 1)}…`;
      return label;
    }

    const def = defOf(item);
    if (!def) return String(item?.label || "");

    const coreNames = itemCoreNames(def);
    const hasQ = def.hasQuality !== false && item.quality;
    const qTag = hasQ ? qualityTag(item.quality, def) : "";
    const qAbr = hasQ ? qualityShort(item.quality, def) : "";

    const decorate = (core) => {
      let s = core;
      if (def.attachable && item.attached === false) s = `${s} ·OFF`;
      return s;
    };

    const variants = [];
    const push = (core) => {
      const s = decorate(core);
      if (s && !variants.includes(s)) variants.push(s);
    };

    for (const core of coreNames) {
      if (hasQ) {
        push(`${core} [${qTag}]`);
        push(`${core} [${qAbr}]`);
      } else {
        push(core);
      }
    }

    for (const v of variants) {
      if (v.length <= lim) return v;
    }

    const shortest = variants.reduce((a, b) => (a.length <= b.length ? a : b), variants[0] || "");
    if (!shortest) return "";
    if (shortest.length <= lim) return shortest;
    return `${shortest.slice(0, Math.max(1, lim - 1))}…`;
  }

  /**
   * Prefijos de subítem — glifos seguros en VT323 (ASCII + Latin-1).
   * ¤ SAI · + accesorio/módulo/neurodata · » balística
   */
  const SUB_MARK = {
    sai: "¤ ",
    acc: "+ ",
    mod: "+ ",
    bal: "» ",
    ndata: "+ ",
    sub: "+ ",
  };

  const TRASH_ICON =
    `<svg class="ficha-inv-ndata-rm-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">` +
    `<path d="M5.5 2h5l.5 1H14v1H2V3h2.5l.5-1zM3 6h10l-.9 8H3.9L3 6zm3 1v6h1V7H6zm3 0v6h1V7H9z"/>` +
    `</svg>`;

  /** Subítems (accesorio / SAI / balística / módulo) en líneas propias. */
  function listItemSubs(item) {
    const def = defOf(item);
    if (!def || !item || item.kind === "sub") return [];
    const out = [];
    const push = (subKind, id, list) => {
      const o = (list || []).find((x) => x.id === id);
      if (!o) return;
      const mark = SUB_MARK[subKind] || "+ ";
      out.push({
        kind: "sub",
        parentId: item.id,
        subKind,
        subId: id,
        // Dos espacios entre | verde y el símbolo (VT323 mono)
        label: `  ${mark}${o.name}`,
      });
    };
    for (const id of item.accessories || []) push("acc", id, def.accessories);
    for (const id of item.sai || []) push("sai", id, def.sai);
    for (const id of item.ballistics || []) push("bal", id, def.ballistics);
    for (const id of item.modules || []) push("mod", id, def.modules);
    for (const entry of normalizeNeurodata(item.neurodata)) {
      const o = (def.neurodataOpts || []).find((x) => x.id === entry.id);
      if (!o) continue;
      const mark = SUB_MARK.ndata;
      out.push({
        kind: "sub",
        parentId: item.id,
        subKind: "ndata",
        subId: entry.id,
        label: `  ${mark}${neurodataDisplayName(o, entry.note)}`,
      });
    }
    if (isGrenadeItem(item)) {
      ensureCharges(item);
      out.push({
        kind: "sub",
        parentId: item.id,
        subKind: "charges",
        label: "",
      });
    }
    return out;
  }

  function countsForPsique(item) {
    const def = defOf(item);
    if (!def || def.column !== "cromos") return false;
    if (def.countsAsCromo === false) return false;
    if (def.attachable !== false && item.attached === false) return false;
    return true;
  }

  function makePsiqueLoadItem(loadIndex, stat) {
    return {
      kind: "psique-load",
      loadIndex,
      stat: STATS.includes(stat) ? stat : "en",
    };
  }

  function existingPsiqueLoads(form) {
    const map = new Map();
    form.querySelectorAll('.ficha-inv-row[data-ledger="cromos"]').forEach((row) => {
      const item = parseSlot(row.querySelector('input[data-inv="1"]')?.value);
      if (item?.kind === "psique-load") {
        map.set(item.loadIndex, STATS.includes(item.stat) ? item.stat : "en");
      }
    });
    return map;
  }

  function buildLedgerLines(form, ledger) {
    const parents = collectParents(form, ledger);
    const lines = [];
    if (ledger !== "cromos") {
      for (const p of parents) {
        lines.push({ type: "parent", item: p });
        for (const s of listItemSubs(p)) lines.push({ type: "sub", item: s });
      }
      return lines;
    }
    const prevLoads = existingPsiqueLoads(form);
    let counted = 0;
    for (const p of parents) {
      lines.push({ type: "parent", item: p });
      for (const s of listItemSubs(p)) lines.push({ type: "sub", item: s });
      if (!countsForPsique(p)) continue;
      counted += 1;
      if (counted % 3 !== 0) continue;
      const loadIndex = counted / 3 - 1;
      lines.push({
        type: "psique-load",
        item: makePsiqueLoadItem(loadIndex, prevLoads.get(loadIndex) || "en"),
      });
    }
    return lines;
  }

  function linesForLedger(form, ledger) {
    return buildLedgerLines(form, ledger).length;
  }

  function collectPsiqueLoads(form) {
    const out = [];
    form.querySelectorAll('.ficha-inv-row[data-ledger="cromos"]').forEach((row) => {
      const item = parseSlot(row.querySelector('input[data-inv="1"]')?.value);
      if (item?.kind === "psique-load") out.push(item);
    });
    return out;
  }

  function sumPsiqueLoadPenalties(form) {
    const sum = { en: 0, mc: 0, rc: 0, tm: 0 };
    for (const item of collectPsiqueLoads(form)) {
      const k = item.stat;
      if (k && sum[k] !== undefined) sum[k] -= 1;
    }
    return sum;
  }

  function isParentItem(item) {
    if (!item || item.kind === "sub" || item.kind === "psique-load") return false;
    return !!(item.catalogId || String(item.label || "").trim());
  }

  function collectParents(form, ledger) {
    const parents = [];
    form.querySelectorAll(`.ficha-inv-row[data-ledger="${ledger}"]`).forEach((row) => {
      const item = parseSlot(row.querySelector('input[data-inv="1"]')?.value);
      if (!isParentItem(item)) return;
      parents.push(item);
    });
    parents.sort((a, b) => {
      const rank = (it) => {
        if (ledger === "chaperia") {
          if (it?.arsenalFixed) return 0;
          if (it?.arsenalInitial) return 1;
          return 2;
        }
        if (it?.cromoFixed) return 0;
        return 1;
      };
      return rank(a) - rank(b);
    });
    return parents;
  }

  function packLedger(form, ledger, maxRows, refreshInvRow) {
    if (!form || !ledger) return true;
    const lines = buildLedgerLines(form, ledger);
    if (lines.length > maxRows) return false;

    const rows = [...form.querySelectorAll(`.ficha-inv-row[data-ledger="${ledger}"]`)];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const input = row.querySelector('input[data-inv="1"]');
      if (!input) continue;
      const line = lines[i];
      if (!line) {
        input.value = "";
        row.classList.remove("is-sub", "is-psique-load", "is-grenade", "is-charges");
        delete row.dataset.parentId;
        delete row.dataset.subKind;
      } else if (line.type === "parent") {
        if (isGrenadeItem(line.item)) ensureCharges(line.item);
        input.value = serializeSlot(line.item);
        row.classList.remove("is-sub", "is-psique-load", "is-charges");
        row.classList.toggle("is-grenade", isGrenadeItem(line.item));
        delete row.dataset.parentId;
        delete row.dataset.subKind;
      } else if (line.type === "psique-load") {
        input.value = serializeSlot(line.item);
        row.classList.add("is-sub", "is-psique-load");
        row.classList.remove("is-grenade", "is-charges");
        delete row.dataset.parentId;
        row.dataset.subKind = "psique";
      } else {
        input.value = serializeSlot(line.item);
        row.classList.add("is-sub");
        row.classList.remove("is-psique-load", "is-grenade");
        row.classList.toggle("is-charges", line.item.subKind === "charges");
        row.dataset.parentId = line.item.parentId || "";
        row.dataset.subKind = line.item.subKind || "";
      }
      refreshInvRow?.(row);
    }
    return true;
  }

  function packLedgers(form, maxRows, refreshInvRow) {
    packLedger(form, "cromos", maxRows, refreshInvRow);
    packLedger(form, "chaperia", maxRows, refreshInvRow);
  }

  function findParentRow(form, ledger, parentId) {
    if (!parentId) return null;
    for (const row of form.querySelectorAll(`.ficha-inv-row[data-ledger="${ledger}"]`)) {
      if (row.classList.contains("is-sub")) continue;
      const it = parseSlot(row.querySelector('input[data-inv="1"]')?.value);
      if (it?.id === parentId) return row;
    }
    return null;
  }

  function wouldFitSub(form, ledger, parentItem, maxRows) {
    const parents = collectParents(form, ledger).map((p) =>
      p.id === parentItem.id ? parentItem : p
    );
    if (!parents.some((p) => p.id === parentItem.id)) parents.push(parentItem);
    const lines = [];
    if (ledger !== "cromos") {
      for (const p of parents) {
        lines.push({ type: "parent", item: p });
        for (const s of listItemSubs(p)) lines.push({ type: "sub", item: s });
      }
      return lines.length <= maxRows;
    }
    let counted = 0;
    for (const p of parents) {
      lines.push({ type: "parent", item: p });
      for (const s of listItemSubs(p)) lines.push({ type: "sub", item: s });
      if (!countsForPsique(p)) continue;
      counted += 1;
      if (counted % 3 === 0) {
        lines.push({ type: "psique-load", item: makePsiqueLoadItem(counted / 3 - 1, "en") });
      }
    }
    return lines.length <= maxRows;
  }

  function wouldFitNewParent(form, ledger, maxRows) {
    return linesForLedger(form, ledger) + 1 <= maxRows;
  }

  function paintChargeButtons(row, item) {
    if (!row) return;
    const wrap = row.querySelector(".ficha-inv-wrap");
    const trigger = row.querySelector(".ficha-inv-trigger");
    if (!wrap || !trigger) return;
    let host = wrap.querySelector(".ficha-inv-charges");
    const show = !!(item && isGrenadeItem(item));
    if (!show) {
      if (host) host.hidden = true;
      trigger.hidden = false;
      trigger.removeAttribute("aria-hidden");
      trigger.tabIndex = 0;
      return;
    }
    ensureCharges(item);
    if (!host) {
      host = document.createElement("span");
      host.className = "ficha-inv-charges";
      wrap.appendChild(host);
    }
    const charges = item.charges || defaultCharges();
    host.innerHTML = charges
      .map(
        (on, i) =>
          `<button type="button" class="ficha-inv-charge${on ? " is-on" : ""}" data-charge-idx="${i}" ` +
          `aria-pressed="${on}" aria-label="Carga ${i + 1}">[${on ? "×" : "\u00A0"}]</button>`
      )
      .join("");
    host.hidden = false;
    trigger.hidden = false;
    trigger.removeAttribute("aria-hidden");
    trigger.textContent = "\u00A0";
    trigger.tabIndex = -1;
    trigger.setAttribute("aria-hidden", "true");
  }

  function toggleGrenadeCharge(form, chargesRow, idx, maxRows, refreshInvRow) {
    if (!chargesRow) return false;
    const parentId = chargesRow.dataset.parentId;
    const parentRow = findParentRow(form, chargesRow.dataset.ledger || "chaperia", parentId);
    if (!parentRow) return false;
    const input = parentRow.querySelector('input[data-inv="1"]');
    const item = parseSlot(input?.value);
    if (!item || !isGrenadeItem(item)) return false;
    ensureCharges(item);
    if (!Number.isInteger(idx) || idx < 0 || idx >= GRENADE_CHARGES) return false;
    item.charges[idx] = !item.charges[idx];
    input.value = serializeSlot(item);
    packLedger(form, chargesRow.dataset.ledger || "chaperia", maxRows || 30, refreshInvRow);
    return true;
  }

  function statsFor(item) {
    if (item?.kind === "sub") return {};
    const def = defOf(item);
    if (!def || !item?.attached) return {};
    const out = { ...fixedStatsFor(item, def) };
    for (const [k, v] of Object.entries(moduleStatsFor(item, def))) {
      out[k] = (Number(out[k]) || 0) + Number(v);
    }
    if (def.statPoolByQuality) {
      const keys = statPoolKeys(def);
      const applied = item.appliedStats || {};
      for (const k of keys) {
        const v = Number(applied[k]) || 0;
        if (v) out[k] = (Number(out[k]) || 0) + v;
      }
    }
    return out;
  }

  function parseSlot(raw) {
    if (raw == null || raw === "") return null;
    if (typeof raw === "object") return raw;
    const s = String(raw);
    if (s.startsWith("{")) {
      try {
        return JSON.parse(s);
      } catch {
        return { id: uid(), catalogId: null, label: s, kind: "note" };
      }
    }
    return { id: uid(), catalogId: null, label: s, kind: "note" };
  }

  function serializeSlot(item) {
    if (!item) return "";
    if (item.kind === "note") return item.label || "";
    return JSON.stringify(item);
  }

  function closeMenus(form) {
    hideTip();
    form.querySelectorAll(".ficha-inv-menu").forEach((m) => {
      m.hidden = true;
      m.style.position = "";
      m.style.left = "";
      m.style.top = "";
      m.style.bottom = "";
      m.style.width = "";
      m.style.maxHeight = "";
      m.style.zIndex = "";
      m.classList.remove("ficha-inv-menu-up");
    });
    form.querySelectorAll(".ficha-inv-trigger").forEach((t) => {
      t.setAttribute("aria-expanded", "false");
    });
  }

  function placeMenu(menu, row) {
    const trigger = row.querySelector(".ficha-inv-trigger") || row;
    const rect = trigger.getBoundingClientRect();
    const vh = window.innerHeight;
    const spaceBelow = vh - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUp = spaceBelow < 168 && spaceAbove > spaceBelow;
    const maxH = Math.max(140, Math.min(280, openUp ? spaceAbove : spaceBelow, Math.floor(vh * 0.4)));
    const width = Math.max(rect.width, Math.min(280, window.innerWidth - 16));
    let left = Math.round(rect.left);
    if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);

    menu.classList.toggle("ficha-inv-menu-up", openUp);
    menu.style.position = "fixed";
    menu.style.left = `${left}px`;
    menu.style.width = `${Math.round(width)}px`;
    menu.style.maxHeight = `${maxH}px`;
    menu.style.zIndex = "120";
    if (openUp) {
      menu.style.top = "auto";
      menu.style.bottom = `${Math.round(vh - rect.top + 4)}px`;
    } else {
      menu.style.bottom = "auto";
      menu.style.top = `${Math.round(rect.bottom + 4)}px`;
    }
  }

  const KIND_LABEL = {
    arma: "Arma",
    cromo: "Cromo",
    herramienta: "Herramienta",
    vestimenta: "Vestimenta",
    neurodata: "Neurodata",
  };

  let tipEl = null;
  let tipTimer = null;
  let tipHideTimer = null;
  let tipAnchor = null;

  function ensureTip() {
    if (tipEl && tipEl.isConnected) return tipEl;
    tipEl = document.createElement("div");
    tipEl.id = "ficha-inv-tip";
    tipEl.className = "ficha-inv-tip";
    tipEl.hidden = true;
    tipEl.setAttribute("role", "tooltip");
    document.body.appendChild(tipEl);
    return tipEl;
  }

  function hideTip() {
    clearTimeout(tipTimer);
    clearTimeout(tipHideTimer);
    tipTimer = null;
    tipHideTimer = null;
    tipAnchor = null;
    const tip = tipEl || document.getElementById("ficha-inv-tip");
    if (tip) tip.hidden = true;
  }

  function placeTip(tip, anchor) {
    if (!tip || !anchor || !anchor.isConnected) return;
    tip.hidden = false;
    const r = anchor.getBoundingClientRect();
    const pad = 8;
    const tw = tip.offsetWidth || 240;
    const th = tip.offsetHeight || 120;
    let left = r.right - 4; // solapa un poco para no “perder” el tip en el hueco
    let top = r.top;
    if (left + tw > window.innerWidth - pad) left = Math.max(pad, r.left - tw - pad);
    if (left < pad) left = pad;
    if (top + th > window.innerHeight - pad) top = Math.max(pad, window.innerHeight - th - pad);
    if (top < pad) top = pad;
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  }

  function tipBlock(title, body) {
    return (
      `<div class="ficha-inv-tip-sec">${esc(title)}</div>` +
      (body ? `<div class="ficha-inv-tip-body">${tipRich(body)}</div>` : "")
    );
  }

  function tipLine(label, value) {
    if (!value) return "";
    return `<div class="ficha-inv-tip-line"><span class="ficha-inv-tip-k">${esc(label)}</span> ${tipRich(value)}</div>`;
  }

  /** Resalta ventaja/desventaja (+ EN/MC/RC/TM) y bonos +N STAT en textos de tip. */
  function tipRich(text) {
    // Sin flag `i` en atributos: "en" (prep.) ≠ "EN" (stat).
    let s = esc(text).replace(
      /(Desventaja|desventaja|Ventaja|ventaja)((?:\s+en)?(?:\s+(?:EN|MC|RC|TM)(?:,\s*(?:EN|MC|RC|TM))*(?:\s+o\s+(?:EN|MC|RC|TM))?)?)/g,
      (match, word, rest) => {
        const cls = /^[Dd]es/.test(word) ? "ficha-inv-tip-dis" : "ficha-inv-tip-adv";
        return `<span class="${cls}">${word}${rest || ""}</span>`;
      }
    );
    s = s.replace(/(\+\d+\s*(?:EN|MC|RC|TM))/g, '<span class="ficha-inv-tip-adv">$1</span>');
    return s;
  }

  function formatStatMap(st) {
    if (!st || typeof st !== "object") return "";
    return Object.entries(st)
      .filter(([, v]) => Number(v))
      .map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${String(k).toUpperCase()}`)
      .join(", ");
  }

  function buildQualityTipSections(def, onlyQuality) {
    const byQ = def?.detailByQuality;
    if (!byQ || typeof byQ !== "object") return "";
    const qualities = onlyQuality ? [onlyQuality] : CAT()?.Q || [];
    let html = "";
    for (const q of qualities) {
      const text = byQ[q];
      if (!text) continue;
      html += tipLine(def.qualitySection ? `${def.qualitySection} actual` : "Calidad actual", qualityLabel(q, def));
      html += `<div class="ficha-inv-tip-body">${tipRich(text)}</div>`;
    }
    return html;
  }

  function buildDefTipHtml(def, opts = {}) {
    if (!def) return tipBlock("—", "Sin datos en catálogo.");
    const kind = KIND_LABEL[def.kind] || def.kind || "Ítem";
    let html = tipBlock(def.name || "Ítem", kind);
    if (def.detail) html += `<div class="ficha-inv-tip-body">${tipRich(def.detail)}</div>`;
    if (def.detailByQuality && opts.quality) {
      html += buildQualityTipSections(def, opts.quality);
    }
    if (def.moduleSlots && !def.saiSlots) {
      if (opts.quality) {
        html += tipLine("Cupo módulos", String(moduleCap(def, opts.quality)));
      } else {
        const slots = (CAT()?.Q || [])
          .map((q) => `${qualityShort(q)}:${def.moduleSlots[q] ?? 0}`)
          .join(" · ");
        html += tipLine("Cupo módulos", slots);
      }
    }
    // Bono de la calidad actual (o fijo si no hay calidades)
    if (def.statsByQuality) {
      if (def.hasQuality === false) {
        const flat =
          formatStatMap(def.statsByQuality.impro) ||
          formatStatMap(Object.values(def.statsByQuality).find((v) => v && Object.keys(v).length));
        if (flat) html += tipLine("Bono", flat);
      } else if (opts.quality) {
        const cur = formatStatMap(def.statsByQuality[opts.quality]);
        if (cur) html += tipLine("Bono", cur);
      }
    }
    if (def.attachable) html += tipLine("Acoplable", "Sí (cromo)");
    if (def.countsAsCromo === false && def.kind === "cromo") {
      html += tipLine("@Psique", "sin degeneración neural");
    }
    return html;
  }

  function buildOptionTipHtml(kind, opt, parentItem) {
    if (!opt) return tipBlock("—", "");
    const title =
      kind === "acc"
        ? "Accesorio"
        : kind === "bal"
          ? "Balística especial"
          : kind === "mod"
            ? "Módulo"
            : kind === "ndata"
              ? "Neurodata"
              : "Opción";
    let html = tipBlock(opt.name || "—", title);
    if (opt.detail) html += `<div class="ficha-inv-tip-body">${tipRich(opt.detail)}</div>`;
    const parentQ = parentItem?.quality;
    if (opt.detailByQuality && parentQ && opt.detailByQuality[parentQ]) {
      const parentDef = defOf(parentItem);
      html += tipLine(
        parentDef?.qualitySection ? `${parentDef.qualitySection} actual` : "Calidad actual",
        qualityLabel(parentQ, parentDef)
      );
      html += `<div class="ficha-inv-tip-body">${tipRich(opt.detailByQuality[parentQ])}</div>`;
    } else if (opt.detailByQuality && !parentQ) {
      // Sin calidad de padre aún: ficha completa compacta
      const full = (CAT()?.Q || [])
        .map((q) => {
          const t = opt.detailByQuality[q];
          return t ? `${qualityShort(q)}: ${t}` : "";
        })
        .filter(Boolean)
        .join("\n");
      if (full) html += `<div class="ficha-inv-tip-body">${tipRich(full)}</div>`;
    } else if (!opt.detail && !opt.detailByQuality) {
      html += `<div class="ficha-inv-tip-body muted">Sin ficha ampliada.</div>`;
    }
    const bonus = formatStatMap(opt.stats);
    if (bonus) html += tipLine("Bono", bonus);
    return html;
  }

  function buildItemTipHtml(item) {
    const def = defOf(item);
    if (!def) {
      const label = String(item?.label || "").trim();
      return tipBlock(label || "Nota", "Texto libre en inventario.");
    }
    let html = buildDefTipHtml(def, { quality: item.quality });
    if (def.hasQuality !== false && item.quality && !def.detailByQuality) {
      html += tipLine("Calidad actual", qualityLabel(item.quality, def));
    }
    if (def.saiSlots && item.quality) {
      html += tipLine("SAI", String(saiCap(def, item.quality)));
    }
    const st = statsFor({ ...item, attached: true });
    const stLine = formatStatMap(st);
    if (stLine) {
      html += tipLine(
        "Bonos activos",
        item.attached === false ? `${stLine} (desacoplado: no aplica)` : stLine
      );
    } else if (def.attachable && item.attached === false) {
      html += tipLine("Estado", "Desacoplado del cuerpo");
    }
    const named = (ids, list, prefix) =>
      (ids || [])
        .map((id) => {
          const o = (list || []).find((x) => x.id === id);
          return o ? `${prefix}${o.name}` : null;
        })
        .filter(Boolean);
    const accs = named(item.accessories, def.accessories, "");
    const bals = named(item.ballistics, def.ballistics, "Bal·");
    const mods = named(item.modules, def.modules, "");
    const nds = normalizeNeurodata(item.neurodata)
      .map((entry) => {
        const o = (def.neurodataOpts || []).find((x) => x.id === entry.id);
        return o ? neurodataDisplayName(o, entry.note) : null;
      })
      .filter(Boolean);
    if (accs.length) html += tipBlock("Accesorios", accs.join("\n"));
    if (nds.length) html += tipBlock("Neurodata", nds.join("\n"));
    if (bals.length) html += tipBlock("Balística especial", bals.join("\n"));
    if (mods.length) html += tipBlock("Módulos", mods.join("\n"));
    if (item.arsenalFixed) {
      html += tipLine("Arsenal fijo", "No se puede cambiar ni eliminar");
    } else if (item.arsenalInitial) {
      html += tipLine("Arsenal inicial", "Arma de profesión");
    }
    html += `<div class="ficha-inv-tip-foot">Clic para editar</div>`;
    return html;
  }

  function showTipHtml(html, anchor) {
    clearTimeout(tipHideTimer);
    if (!anchor?.isConnected) return;
    const tip = ensureTip();
    tip.innerHTML = html;
    tipAnchor = anchor;
    placeTip(tip, anchor);
    requestAnimationFrame(() => {
      if (tipAnchor === anchor) placeTip(tip, anchor);
    });
  }

  function scheduleTip(html, anchor, delay = 90) {
    clearTimeout(tipTimer);
    if (delay <= 0) {
      showTipHtml(html, anchor);
      return;
    }
    tipTimer = setTimeout(() => showTipHtml(html, anchor), delay);
  }

  function tipHtmlForOptButton(btn, row) {
    if (btn.dataset.add) {
      const def = CAT()?.get(btn.dataset.add);
      return buildDefTipHtml(def);
    }
    if (btn.dataset.arsenalPick) {
      const id = (() => {
        const key = String(btn.dataset.arsenalPick || "").toLowerCase();
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
      })();
      return buildDefTipHtml(id ? CAT()?.get(id) : { name: btn.dataset.arsenalPick, kind: "arma" });
    }
    const input = row?.querySelector('input[data-inv="1"]');
    const item = parseSlot(input?.value || "");
    const def = defOf(item);
    if (btn.dataset.acc) {
      const opt = (def?.accessories || []).find((x) => x.id === btn.dataset.acc);
      return buildOptionTipHtml("acc", opt || { name: btn.textContent.trim() }, item);
    }
    if (btn.dataset.sai) {
      return "";
    }
    if (btn.dataset.bal) {
      const opt = (def?.ballistics || []).find((x) => x.id === btn.dataset.bal);
      return buildOptionTipHtml("bal", opt || { name: btn.textContent.trim() }, item);
    }
    if (btn.dataset.mod) {
      const opt = (def?.modules || []).find((x) => x.id === btn.dataset.mod);
      return buildOptionTipHtml("mod", opt || { name: btn.textContent.trim() }, item);
    }
    if (btn.dataset.ndata) {
      const opt = (def?.neurodataOpts || []).find((x) => x.id === btn.dataset.ndata);
      return buildOptionTipHtml("ndata", opt || { name: btn.textContent.trim() }, item);
    }
    if (btn.dataset.quality) {
      const q = btn.dataset.quality;
      let html = buildDefTipHtml(def, { quality: q });
      if (!def?.detailByQuality) {
        html += tipLine("Calidad actual", qualityLabel(q, def));
      }
      if (def?.saiSlots) {
        html += tipLine("SAI", String(saiCap(def, q)));
      }
      return html;
    }
    return "";
  }

  function bindHoverTips(form) {
    ensureTip();
    let activeKey = "";
    let lastX = 0;
    let lastY = 0;
    let moveRaf = 0;
    if (form.dataset.tipBound === "1") return;
    form.dataset.tipBound = "1";

    tipEl.addEventListener("pointerenter", () => {
      clearTimeout(tipHideTimer);
    });
    tipEl.addEventListener("pointerleave", () => {
      requestHideTip(160);
    });

    function tipKey(el) {
      if (!(el instanceof Element)) return "";
      if (el.classList.contains("ficha-inv-opt")) {
        return (
          "opt:" +
          (el.dataset.add ||
            el.dataset.acc ||
            el.dataset.sai ||
            el.dataset.bal ||
            el.dataset.mod ||
            el.dataset.ndata ||
            el.dataset.ndataRm ||
            el.dataset.arsenalPick ||
            el.dataset.quality ||
            el.dataset.act ||
            el.textContent.trim())
        );
      }
      if (el.classList.contains("ficha-inv-q")) return `q:${el.dataset.quality || ""}`;
      if (el.classList.contains("ficha-inv-trigger")) {
        const row = el.closest(".ficha-inv-row");
        return `tr:${row?.dataset.ledger || ""}:${row?.dataset.idx || ""}`;
      }
      return "";
    }

    function resolveHit(node) {
      if (!(node instanceof Element)) return null;
      if (tipEl?.contains(node)) return { type: "tip", el: tipEl };
      const opt = node.closest(".ficha-inv-opt");
      if (opt && form.contains(opt) && !opt.disabled) return { type: "opt", el: opt };
      const qBtn = node.closest(".ficha-inv-q");
      if (qBtn && form.contains(qBtn) && qBtn.dataset.quality) return { type: "q", el: qBtn };
      const trigger = node.closest(".ficha-inv-trigger");
      if (trigger && form.contains(trigger)) {
        const menu = trigger.closest(".ficha-inv-row")?.querySelector(".ficha-inv-menu");
        if (menu && !menu.hidden) return null;
        return { type: "trigger", el: trigger };
      }
      return null;
    }

    function htmlForHit(hit) {
      if (!hit || hit.type === "tip") return "";
      if (hit.type === "opt" || hit.type === "q") {
        return tipHtmlForOptButton(hit.el, hit.el.closest(".ficha-inv-row"));
      }
      const row = hit.el.closest(".ficha-inv-row");
      const input = row?.querySelector('input[data-inv="1"]');
      const raw = String(input?.value || "");
      const item = parseSlot(raw);
      if (item?.kind === "sub") {
        const parentRow = findParentRow(form, row?.dataset.ledger, item.parentId || row?.dataset.parentId);
        const parent = parseSlot(parentRow?.querySelector('input[data-inv="1"]')?.value);
        const def = defOf(parent);
        let opt = null;
        let kind = item.subKind;
        if (kind === "acc") opt = (def?.accessories || []).find((x) => x.id === item.subId);
        if (kind === "sai") return "";
        if (kind === "bal") opt = (def?.ballistics || []).find((x) => x.id === item.subId);
        if (kind === "mod") opt = (def?.modules || []).find((x) => x.id === item.subId);
        if (kind === "ndata") opt = (def?.neurodataOpts || []).find((x) => x.id === item.subId);
        return (
          buildOptionTipHtml(kind || "acc", opt || { name: item.label || "Subítem" }, parent) +
          tipLine("De", def?.name || "ítem padre") +
          `<div class="ficha-inv-tip-foot">Clic para editar el ítem padre</div>`
        );
      }
      const empty = !raw.trim() || (!item?.catalogId && !(item?.label || "").trim());
      if (empty) {
        return tipBlock("Ranura vacía", "Clic para abrir el catálogo y agregar un elemento.");
      }
      return buildItemTipHtml(item);
    }

    function stillOverTipZone() {
      const under = document.elementFromPoint(lastX, lastY);
      if (!under) return false;
      if (tipEl?.contains(under)) return true;
      if (tipAnchor && (under === tipAnchor || tipAnchor.contains(under))) return true;
      const hit = resolveHit(under);
      return !!(hit && tipKey(hit.el) === activeKey);
    }

    function requestHideTip(ms = 200) {
      clearTimeout(tipHideTimer);
      tipHideTimer = setTimeout(() => {
        if (stillOverTipZone()) return;
        activeKey = "";
        hideTip();
      }, ms);
    }

    function activateHit(hit) {
      if (!hit || hit.type === "tip") {
        clearTimeout(tipHideTimer);
        return;
      }
      const key = tipKey(hit.el);
      if (!key) return;
      clearTimeout(tipHideTimer);
      const html = htmlForHit(hit);
      if (!html) return;

      // Ya visible para el mismo ancla: solo reposicionar / refrescar
      if (key === activeKey && tipEl && !tipEl.hidden) {
        tipAnchor = hit.el;
        placeTip(tipEl, hit.el);
        return;
      }

      activeKey = key;
      // Delay corto; si ya hay tip abierto, cambiar al toque
      const delay = tipEl && !tipEl.hidden ? 40 : 90;
      scheduleTip(html, hit.el, delay);
    }

    form.addEventListener(
      "pointermove",
      (ev) => {
        lastX = ev.clientX;
        lastY = ev.clientY;
        if (moveRaf) return;
        moveRaf = requestAnimationFrame(() => {
          moveRaf = 0;
          const hit = resolveHit(ev.target);
          if (hit) {
            activateHit(hit);
            return;
          }
          // Fuera de triggers/opts pero quizá sobre el tip o el hueco hacia el tip
          if (activeKey) requestHideTip(180);
        });
      },
      { passive: true }
    );

    form.addEventListener("pointerenter", (ev) => {
      lastX = ev.clientX;
      lastY = ev.clientY;
      const hit = resolveHit(ev.target);
      if (hit) activateHit(hit);
    });

    form.addEventListener("pointerleave", (ev) => {
      // Si salimos hacia el tip (fuera del form), no ocultar
      const rel = ev.relatedTarget;
      if (rel instanceof Node && tipEl?.contains(rel)) {
        clearTimeout(tipHideTimer);
        return;
      }
      requestHideTip(220);
    });

    // Re-chequear al moverse sobre el tip (está en document.body)
    document.addEventListener(
      "pointermove",
      (ev) => {
        if (!tipEl || tipEl.hidden) return;
        lastX = ev.clientX;
        lastY = ev.clientY;
        if (tipEl.contains(ev.target)) {
          clearTimeout(tipHideTimer);
          return;
        }
        const hit = resolveHit(ev.target);
        if (hit) activateHit(hit);
        else if (activeKey) requestHideTip(160);
      },
      { passive: true }
    );
  }

  const CATALOG_EXCLUDE_IDS = ["pistola-improvisada", "neuroranura"];

  function catalogItemAllowed(it, column, opts = {}) {
    if (!it || it.column !== column) return false;
    if (column === "chaperia" && it.kind === "neurodata") return false;
    const excludeIds = opts.excludeIds || CATALOG_EXCLUDE_IDS;
    if (excludeIds.includes(it.id)) return false;
    if (opts.excludeWeapons && it.kind === "arma") return false;
    return true;
  }

  function catalogItemLabel(it, sec) {
    const name = String(it?.name || "").trim();
    if (sec?.stripNeurochipPrefix || (it?.id || "").startsWith("neurochip-")) {
      return neurochipSubtypeName(name) || name;
    }
    return name;
  }

  function buildCatalogMenuHtml(column, opts = {}) {
    const sections = CAT()?.sections?.[column] || [];
    return sections
      .map((sec) => {
        const items = (sec.items || []).filter((it) => catalogItemAllowed(it, column, opts));
        if (!items.length) return "";
        const head = `<div class="ficha-inv-sec" role="presentation">${esc(sec.title)}</div>`;
        const optClass = sec.optClass ? ` ${sec.optClass}` : "";
        const optsHtml = items
          .map(
            (it) =>
              `<button type="button" class="ficha-inv-opt${optClass}" data-add="${esc(it.id)}">${esc(catalogItemLabel(it, sec))}</button>`
          )
          .join("");
        return head + optsHtml;
      })
      .filter(Boolean)
      .join("");
  }

  function buildItemMenuHtml(item) {
    const def = defOf(item);
    if (!def) {
      return `<button type="button" class="ficha-inv-opt" data-act="delete">Eliminar</button>`;
    }
    if (item.arsenalFixed) {
      return `<div class="ficha-inv-sec">Arsenal fijo</div>`;
    }
    const lockedQ = !!def.lockedQuality || item.arsenalFixed;
    const cromoHead = item.cromoFixed
      ? `<div class="ficha-inv-sec">Neuroranura inicial</div>`
      : "";
    const qRow =
      def.hasQuality === false
        ? ""
        : `<div class="ficha-inv-sec">${esc(def.qualitySection || "Calidad")}</div>` +
          `<div class="ficha-inv-quality" role="group" aria-label="${esc(def.qualitySection || "Calidad")}">` +
          (CAT()?.Q || [])
            .map((q) => {
              const on = item.quality === q;
              const dis = lockedQ ? " disabled" : "";
              return (
                `<button type="button" class="ficha-inv-q${on ? " is-on" : ""}" data-quality="${q}"${dis} aria-pressed="${on}">` +
                `<span class="ficha-inv-q-box">[${on ? "×" : " "}]</span>` +
                `<span class="ficha-inv-q-lab">${esc(qualityShort(q, def))}</span>` +
                `</button>`
              );
            })
            .join("") +
          `</div>`;

    const accList = def.accessories || [];
    const modList = def.modules || [];
    const ndList = def.neurodataOpts || [];
    const saiList = def.sai || [];
    const balList = def.ballistics || [];
    const capSai = saiCap(def, item.quality);
    const capMod = moduleCap(def, item.quality);
    const capNd = neurodataCap(def, item.quality);

    const statRow = buildStatsMenuHtml(item, def);

    let extras = "";
    if (accList.length) {
      extras += `<div class="ficha-inv-sec">Agregar accesorio</div>`;
      extras += accList
        .map((a) => {
          const has = (item.accessories || []).includes(a.id);
          return `<button type="button" class="ficha-inv-opt" data-acc="${esc(a.id)}" ${has ? 'aria-selected="true"' : ""}>${has ? "× " : ""}${esc(a.name)}</button>`;
        })
        .join("");
    }
    if (saiList.length) {
      extras += `<div class="ficha-inv-sec">Agregar SAI (${(item.sai || []).length}/${capSai})</div>`;
      extras += saiList
        .map((s) => {
          const has = (item.sai || []).includes(s.id);
          const full = !has && (item.sai || []).length >= capSai;
          return `<button type="button" class="ficha-inv-opt" data-sai="${esc(s.id)}" ${has ? 'aria-selected="true"' : ""} ${full ? "disabled" : ""}>${has ? "× " : ""}${esc(s.name)}</button>`;
        })
        .join("");
    }
    if (balList.length) {
      extras += `<div class="ficha-inv-sec">Agregar balística especial</div>`;
      extras += balList
        .map((b) => {
          const has = (item.ballistics || []).includes(b.id);
          return `<button type="button" class="ficha-inv-opt" data-bal="${esc(b.id)}" ${has ? 'aria-selected="true"' : ""}>${has ? "× " : ""}${esc(b.name)}</button>`;
        })
        .join("");
    }
    if (modList.length) {
      extras += `<div class="ficha-inv-sec">Agregar módulo (${(item.modules || []).length}/${capMod || "—"})</div>`;
      extras += modList
        .map((m) => {
          const has = (item.modules || []).includes(m.id);
          const full = capMod > 0 && !has && (item.modules || []).length >= capMod;
          return `<button type="button" class="ficha-inv-opt" data-mod="${esc(m.id)}" ${has ? 'aria-selected="true"' : ""} ${full ? "disabled" : ""}>${has ? "× " : ""}${esc(m.name)}</button>`;
        })
        .join("");
    }
    if (ndList.length && capNd > 0) {
      const ndOwned = normalizeNeurodata(item.neurodata);
      const ndFull = ndOwned.length >= capNd;
      extras += `<div class="ficha-inv-sec">Neurodata (${ndOwned.length}/${capNd})</div>`;
      if (ndOwned.length) {
        extras += ndOwned
          .map((entry, i) => {
            const opt = ndList.find((x) => x.id === entry.id);
            const display = neurodataDisplayName(opt, entry.note);
            return (
              `<div class="ficha-inv-ndata-owned">` +
              `<span class="ficha-inv-ndata-name">${esc(display)}</span>` +
              `<button type="button" class="ficha-inv-ndata-rm" data-ndata-rm="${i}" aria-label="Quitar ${esc(display)}" title="Quitar">${TRASH_ICON}</button>` +
              `</div>`
            );
          })
          .join("");
      }
      extras += `<div class="ficha-inv-sec ficha-inv-sec-sub">Agregar</div>`;
      extras += ndList
        .map((n) => {
          return `<button type="button" class="ficha-inv-opt" data-ndata="${esc(n.id)}" ${ndFull ? "disabled" : ""}>${esc(n.name)}</button>`;
        })
        .join("");
    }

    const attachBtn =
      def.attachable && def.column === "cromos"
        ? `<button type="button" class="ficha-inv-opt" data-act="toggle-attach">${
            item.attached === false ? "Acoplar al cuerpo" : "Desacoplar del cuerpo"
          }</button>`
        : "";

    const changeArsenal = item.arsenalInitial
      ? `<button type="button" class="ficha-inv-opt" data-act="change-arsenal">Cambiar arma inicial</button>`
      : "";

    const deleteBtn = item.arsenalInitial
      ? `<button type="button" class="ficha-inv-opt" disabled title="Usá Cambiar arma inicial">Eliminar</button>`
      : item.cromoFixed
        ? `<button type="button" class="ficha-inv-opt" disabled title="Neuroranura de creación">Eliminar</button>`
        : `<button type="button" class="ficha-inv-opt ficha-inv-danger" data-act="delete">Eliminar</button>`;

    return cromoHead + qRow + statRow + extras + attachBtn + changeArsenal + deleteBtn;
  }

  function buildNeurodataPromptHtml(opt) {
    const back = `<button type="button" class="ficha-inv-opt" data-act="ndata-back">← Volver</button>`;
    const head = `<div class="ficha-inv-sec">${esc(opt.name)}</div>`;
    const prompt = `<div class="ficha-inv-ndata-prompt">${esc(
      opt.ndataPrompt || "Describe brevemente el contenido"
    )}</div>`;
    const input =
      `<input type="text" class="ficha-inv-ndata-input" data-ndata-input maxlength="48" ` +
      `autocomplete="off" spellcheck="false" aria-label="${esc(opt.name)}" />`;
    const confirm =
      `<button type="button" class="ficha-inv-opt ficha-inv-ndata-confirm" data-act="ndata-confirm" data-ndata="${esc(opt.id)}">Confirmar</button>`;
    return back + head + prompt + input + confirm;
  }

  function buildPsiqueLoadMenuHtml(item, form, canAssignStat) {
    const head = `<div class="ficha-inv-sec">Degeneración neural</div>`;
    const sub = `<div class="ficha-inv-sec-sub">Elegí −1 en:</div>`;
    const opts = STATS.map((k) => {
      const on = item.stat === k;
      const ok = typeof canAssignStat === "function" ? canAssignStat(form, item, k) : true;
      return (
        `<button type="button" class="ficha-inv-opt ficha-inv-opt-stat${on ? " is-on-stat" : ""}" ` +
        `data-psique-stat="${k}" ${on ? 'aria-selected="true"' : ""} ${ok ? "" : "disabled"}>` +
        `[${k.toUpperCase()}]</button>`
      );
    }).join("");
    return head + sub + opts;
  }

  function buildArsenalChangeMenuHtml(choices, currentName) {
    const head = `<div class="ficha-inv-sec">Arma inicial</div>`;
    const back = `<button type="button" class="ficha-inv-opt" data-act="arsenal-back">← Volver</button>`;
    const opts = (choices || [])
      .map((w) => {
        const on = String(w).toLowerCase() === String(currentName || "").toLowerCase();
        return `<button type="button" class="ficha-inv-opt" data-arsenal-pick="${esc(w)}" ${on ? 'aria-selected="true"' : ""}>${on ? "× " : ""}${esc(w)}</button>`;
      })
      .join("");
    return back + head + opts;
  }

  function bindInventory(ctx) {
    const { form, saveSheet, syncTypedCover, applyInventoryStats, LEDGER_ROWS, refreshInvRow } = ctx;
    if (!form || !CAT()) return;

    bindHoverTips(form);

    const repack = () => {
      packLedgers(form, LEDGER_ROWS || 30, refreshInvRow);
      applyInventoryStats?.();
    };

    form.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter") return;
      const inp = ev.target;
      if (!(inp instanceof HTMLInputElement) || !inp.matches(".ficha-inv-ndata-input")) return;
      ev.preventDefault();
      const menu = inp.closest(".ficha-inv-menu");
      menu?.querySelector('[data-act="ndata-confirm"]')?.click();
    });

    form.addEventListener("click", (ev) => {
      hideTip();
      const t = ev.target;
      if (!(t instanceof Element)) return;

      const chargeBtn = t.closest("[data-charge-idx]");
      if (chargeBtn && form.contains(chargeBtn)) {
        ev.preventDefault();
        ev.stopPropagation();
        const row = chargeBtn.closest(".ficha-inv-row");
        const idx = Number(chargeBtn.dataset.chargeIdx);
        if (row && Number.isInteger(idx)) {
          toggleGrenadeCharge(form, row, idx, LEDGER_ROWS || 30, refreshInvRow);
          saveSheet();
        }
        return;
      }

      if (t.closest(".ficha-inv-menu")) {
        handleMenuClick(ev, { ...ctx, repack });
        return;
      }

      const trigger = t.closest(".ficha-inv-trigger");
      if (!trigger || !form.contains(trigger)) return;
      if (trigger.disabled || trigger.hidden) return;
      ev.preventDefault();
      ev.stopPropagation();

      let row = trigger.closest(".ficha-inv-row");
      if (!row) return;

      const input = row.querySelector('input[data-inv="1"]');
      const column = row.dataset.ledger;
      const raw = String(input?.value || "");
      const item = parseSlot(raw);

      if (item?.kind === "psique-load") {
        const menu = row.querySelector(".ficha-inv-menu");
        if (!menu) return;
        const open = menu.hidden;
        closeMenus(form);
        ctx.closeAllFichaMenus?.();
        if (!open) return;
        menu.innerHTML = buildPsiqueLoadMenuHtml(item, form, ctx.canAssignPsiqueStat);
        placeMenu(menu, row);
        menu.hidden = false;
        trigger.setAttribute("aria-expanded", "true");
        return;
      }

      // Subítem → menú del padre (cargas: no abrir menú)
      if (row.classList.contains("is-sub") && !row.classList.contains("is-psique-load")) {
        if (row.classList.contains("is-charges") || row.dataset.subKind === "charges") return;
        const sub = parseSlot(row.querySelector('input[data-inv="1"]')?.value);
        const parentRow = findParentRow(form, row.dataset.ledger, sub?.parentId || row.dataset.parentId);
        if (!parentRow) return;
        row = parentRow;
      }

      const menu = row.querySelector(".ficha-inv-menu");
      if (!menu) return;

      const open = menu.hidden;
      closeMenus(form);
      ctx.closeAllFichaMenus?.();
      if (!open) return;

      const input2 = row.querySelector('input[data-inv="1"]');
      const column2 = row.dataset.ledger;
      const raw2 = String(input2?.value || "");
      const item2 = parseSlot(raw2);
      const empty =
        !raw2.trim() ||
        (!item2?.catalogId && !(item2?.label || "").trim()) ||
        item2?.kind === "sub" ||
        item2?.kind === "psique-load";
      if (empty) {
        const choices = ctx.getArsenalChoices?.() || [];
        if (row.dataset.arsenalSlot === "1" && choices.length) {
          menu.innerHTML = buildArsenalChangeMenuHtml(choices, "");
        } else {
          menu.innerHTML = buildCatalogMenuHtml(column2);
        }
      } else if (!item2?.catalogId) {
        menu.innerHTML = `<button type="button" class="ficha-inv-opt ficha-inv-danger" data-act="delete">Eliminar</button>`;
      } else {
        menu.innerHTML = buildItemMenuHtml(item2);
      }
      placeMenu(menu, row);
      menu.hidden = false;
      row.querySelector(".ficha-inv-trigger")?.setAttribute("aria-expanded", "true");
      if (!menu.dataset.wheelBound) {
        menu.dataset.wheelBound = "1";
        menu.addEventListener(
          "wheel",
          (wheelEv) => {
            if (menu.scrollHeight <= menu.clientHeight + 1) return;
            const atTop = menu.scrollTop <= 0;
            const atBottom = menu.scrollTop + menu.clientHeight >= menu.scrollHeight - 1;
            if ((wheelEv.deltaY < 0 && atTop) || (wheelEv.deltaY > 0 && atBottom)) return;
            wheelEv.stopPropagation();
          },
          { passive: true }
        );
      }
    });

    document.addEventListener("click", (ev) => {
      if (!(ev.target instanceof Node)) return;
      if (form.contains(ev.target) && ev.target.closest?.(".ficha-inv-row")) return;
      closeMenus(form);
    });
  }

  function reopenParentMenu(form, ledger, parentId, item) {
    closeMenus(form);
    const parentRow = findParentRow(form, ledger, parentId);
    if (!parentRow || !item) return;
    const menu = parentRow.querySelector(".ficha-inv-menu");
    const trigger = parentRow.querySelector(".ficha-inv-trigger");
    if (!menu) return;
    menu.innerHTML = buildItemMenuHtml(item);
    placeMenu(menu, parentRow);
    menu.hidden = false;
    trigger?.setAttribute("aria-expanded", "true");
  }

  function handleMenuClick(ev, ctx) {
    const {
      form,
      saveSheet,
      applyInventoryStats,
      refreshInvRow,
      confirmDelete,
      getArsenalChoices,
      setArsenalChoice,
      LEDGER_ROWS,
      repack,
    } = ctx;
    const maxRows = LEDGER_ROWS || 30;
    const doPack = () => {
      if (typeof repack === "function") repack();
      else packLedgers(form, maxRows, refreshInvRow);
    };

    const btn = ev.target.closest("button");
    if (!btn || !form.contains(btn)) return;
    ev.preventDefault();
    ev.stopPropagation();

    let row = btn.closest(".ficha-inv-row");
    let input = row?.querySelector('input[data-inv="1"]');
    if (!row || !input) return;

    const ledger = row.dataset.ledger;

    const addId = btn.dataset.add;
    if (addId) {
      if (!wouldFitNewParent(form, ledger, maxRows)) {
        window.alert("No hay líneas libres en esta columna para un ítem nuevo.");
        return;
      }
      const def = CAT().get(addId);
      let quality = def?.lockedQuality || null;
      if (def?.hasQuality !== false && !def?.lockedQuality) {
        quality = "impro";
      }
      if (def?.hasQuality === false) quality = null;
      const item = createItem(addId, quality);
      if (!item) return;
      if (def?.column === "cromos") item.attached = true;
      input.value = serializeSlot(item);
      doPack();
      applyInventoryStats();
      closeMenus(form);
      saveSheet();
      return;
    }

    if (btn.dataset.arsenalPick) {
      setArsenalChoice?.(btn.dataset.arsenalPick);
      doPack();
      closeMenus(form);
      saveSheet();
      return;
    }

    let item = parseSlot(input.value);
    if (!item) return;

    if (item.kind === "psique-load") {
      if (btn.dataset.psiqueStat) {
        const stat = btn.dataset.psiqueStat;
        if (typeof ctx.canAssignPsiqueStat === "function" && !ctx.canAssignPsiqueStat(form, item, stat)) {
          window.alert("Esa característica no puede bajar de −4 por degeneración neural.");
          return;
        }
        item.stat = stat;
        input.value = serializeSlot(item);
        refreshInvRow?.(row);
        applyInventoryStats();
        const menu = row.querySelector(".ficha-inv-menu");
        if (menu) {
          menu.innerHTML = buildPsiqueLoadMenuHtml(item, form, ctx.canAssignPsiqueStat);
          placeMenu(menu, row);
        }
        saveSheet();
        return;
      }
      return;
    }

    if (item.kind === "sub") {
      const parentRow = findParentRow(form, ledger, item.parentId);
      if (!parentRow) return;
      row = parentRow;
      input = parentRow.querySelector('input[data-inv="1"]');
      item = parseSlot(input?.value);
      if (!item) return;
    }

    const menu = row.querySelector(".ficha-inv-menu");

    if (btn.dataset.act === "change-arsenal") {
      const choices = getArsenalChoices?.() || [];
      const def = defOf(item);
      menu.innerHTML = buildArsenalChangeMenuHtml(choices, def?.name || "");
      placeMenu(menu, row);
      return;
    }

    if (btn.dataset.act === "arsenal-back") {
      menu.innerHTML = buildItemMenuHtml(item);
      placeMenu(menu, row);
      return;
    }

    if (btn.dataset.act === "ndata-back") {
      menu.innerHTML = buildItemMenuHtml(item);
      placeMenu(menu, row);
      return;
    }

    if (btn.dataset.act === "ndata-confirm") {
      const id = btn.dataset.ndata;
      const def = defOf(item);
      const cap = neurodataCap(def, item.quality);
      const arr = normalizeNeurodata(item.neurodata);
      if (cap > 0 && arr.length >= cap) return;
      const note = menu.querySelector("[data-ndata-input]")?.value?.trim() || "";
      if (!note) {
        window.alert("Escribí una descripción breve.");
        menu.querySelector("[data-ndata-input]")?.focus();
        return;
      }
      arr.push({ id, note });
      const next = { ...item, neurodata: arr };
      if (!wouldFitSub(form, ledger, next, maxRows)) {
        window.alert("No hay líneas libres para esa neurodata.");
        return;
      }
      item.neurodata = arr;
      input.value = serializeSlot(item);
      doPack();
      reopenParentMenu(form, ledger, item.id, item);
      saveSheet();
      return;
    }

    if (btn.dataset.quality) {
      const def = defOf(item);
      if (def?.lockedQuality || item.arsenalFixed) return;
      item.quality = btn.dataset.quality;
      const cap = saiCap(def, item.quality);
      if ((item.sai || []).length > cap) item.sai = item.sai.slice(0, cap);
      const mcap = moduleCap(def, item.quality);
      if (mcap > 0 && (item.modules || []).length > mcap) item.modules = item.modules.slice(0, mcap);
      const ndcap = neurodataCap(def, item.quality);
      if ((item.neurodata || []).length > ndcap) item.neurodata = item.neurodata.slice(0, ndcap);
      clampAppliedStats(item, def);
      input.value = serializeSlot(item);
      doPack();
      applyInventoryStats();
      reopenParentMenu(form, ledger, item.id, item);
      saveSheet();
      return;
    }

    if (btn.dataset.statUp) {
      const def = defOf(item);
      if (!def?.statPoolByQuality) return;
      const key = btn.dataset.statUp;
      if (!statPoolKeys(def).includes(key)) return;
      ensureAppliedStats(item, def);
      const cap = statPoolCap(def, item.quality);
      if (appliedStatTotal(item, def) >= cap) return;
      item.appliedStats[key] = (Number(item.appliedStats[key]) || 0) + 1;
      input.value = serializeSlot(item);
      doPack();
      applyInventoryStats();
      reopenParentMenu(form, ledger, item.id, item);
      saveSheet();
      return;
    }

    if (btn.dataset.statDn) {
      const def = defOf(item);
      if (!def?.statPoolByQuality) return;
      const key = btn.dataset.statDn;
      if (!statPoolKeys(def).includes(key)) return;
      ensureAppliedStats(item, def);
      const cur = Number(item.appliedStats[key]) || 0;
      if (cur <= 0) return;
      item.appliedStats[key] = cur - 1;
      input.value = serializeSlot(item);
      doPack();
      applyInventoryStats();
      reopenParentMenu(form, ledger, item.id, item);
      saveSheet();
      return;
    }

    if (btn.dataset.acc) {
      const id = btn.dataset.acc;
      const set = new Set(item.accessories || []);
      const adding = !set.has(id);
      if (adding) {
        set.add(id);
        const next = { ...item, accessories: [...set] };
        if (!wouldFitSub(form, ledger, next, maxRows)) {
          window.alert("No hay líneas libres para ese accesorio.");
          return;
        }
        item.accessories = [...set];
      } else {
        set.delete(id);
        item.accessories = [...set];
      }
      input.value = serializeSlot(item);
      doPack();
      reopenParentMenu(form, ledger, item.id, item);
      saveSheet();
      return;
    }

    if (btn.dataset.sai) {
      const id = btn.dataset.sai;
      const def = defOf(item);
      const set = new Set(item.sai || []);
      if (set.has(id)) set.delete(id);
      else {
        if (set.size >= saiCap(def, item.quality)) return;
        set.add(id);
        const next = { ...item, sai: [...set] };
        if (!wouldFitSub(form, ledger, next, maxRows)) {
          window.alert("No hay líneas libres para ese SAI.");
          return;
        }
      }
      item.sai = [...set];
      input.value = serializeSlot(item);
      doPack();
      reopenParentMenu(form, ledger, item.id, item);
      saveSheet();
      return;
    }

    if (btn.dataset.bal) {
      const id = btn.dataset.bal;
      const set = new Set(item.ballistics || []);
      if (set.has(id)) set.delete(id);
      else {
        set.add(id);
        const next = { ...item, ballistics: [...set] };
        if (!wouldFitSub(form, ledger, next, maxRows)) {
          window.alert("No hay líneas libres para esa balística.");
          return;
        }
      }
      item.ballistics = [...set];
      input.value = serializeSlot(item);
      doPack();
      reopenParentMenu(form, ledger, item.id, item);
      saveSheet();
      return;
    }

    if (btn.dataset.mod) {
      const id = btn.dataset.mod;
      const def = defOf(item);
      const set = new Set(item.modules || []);
      if (set.has(id)) set.delete(id);
      else {
        const cap = moduleCap(def, item.quality);
        if (cap > 0 && set.size >= cap) return;
        set.add(id);
        const next = { ...item, modules: [...set] };
        if (!wouldFitSub(form, ledger, next, maxRows)) {
          window.alert("No hay líneas libres para ese módulo.");
          return;
        }
      }
      item.modules = [...set];
      input.value = serializeSlot(item);
      doPack();
      reopenParentMenu(form, ledger, item.id, item);
      saveSheet();
      return;
    }

    if (btn.dataset.ndataRm != null && btn.dataset.ndataRm !== "") {
      const idx = Number(btn.dataset.ndataRm);
      const arr = normalizeNeurodata(item.neurodata);
      if (!Number.isInteger(idx) || idx < 0 || idx >= arr.length) return;
      arr.splice(idx, 1);
      item.neurodata = arr;
      input.value = serializeSlot(item);
      doPack();
      reopenParentMenu(form, ledger, item.id, item);
      saveSheet();
      return;
    }

    if (btn.dataset.ndata) {
      const id = btn.dataset.ndata;
      const def = defOf(item);
      const cap = neurodataCap(def, item.quality);
      const arr = normalizeNeurodata(item.neurodata);
      if (cap > 0 && arr.length >= cap) return;
      const opt = (def?.neurodataOpts || []).find((x) => x.id === id);
      if (!opt) return;
      if (opt.ndataPrompt) {
        menu.innerHTML = buildNeurodataPromptHtml(opt);
        placeMenu(menu, row);
        menu.querySelector("[data-ndata-input]")?.focus();
        return;
      }
      arr.push({ id, note: "" });
      const next = { ...item, neurodata: arr };
      if (!wouldFitSub(form, ledger, next, maxRows)) {
        window.alert("No hay líneas libres para esa neurodata.");
        return;
      }
      item.neurodata = arr;
      input.value = serializeSlot(item);
      doPack();
      reopenParentMenu(form, ledger, item.id, item);
      saveSheet();
      return;
    }

    if (btn.dataset.act === "toggle-attach") {
      item.attached = item.attached === false;
      input.value = serializeSlot(item);
      doPack();
      applyInventoryStats();
      reopenParentMenu(form, ledger, item.id, item);
      saveSheet();
      return;
    }

    if (btn.dataset.act === "delete") {
      if (item.arsenalInitial || item.arsenalFixed) {
        window.alert("El arsenal inicial no se elimina. Usá «Cambiar arma inicial».");
        return;
      }
      if (item.cromoFixed) {
        window.alert("La neuroranura inicial no se elimina.");
        return;
      }
      const label = formatItem(item) || item.label || "este elemento";
      const ok =
        typeof confirmDelete === "function"
          ? confirmDelete(label)
          : window.confirm(
              `¿Eliminar «${label}»?\n\nSe quitarán bonos y efectos de ficha ligados a este elemento.`
            );
      if (!ok) return;
      input.value = "";
      doPack();
      applyInventoryStats();
      closeMenus(form);
      saveSheet();
    }
  }

  return {
    createItem,
    collectParents,
    collectPsiqueLoads,
    sumPsiqueLoadPenalties,
    formatItem,
    parseSlot,
    serializeSlot,
    statsFor,
    defOf,
    bindInventory,
    closeMenus,
    packLedgers,
    listItemSubs,
    paintChargeButtons,
    findParentRow,
    isGrenadeItem,
  };
})();
