/** Inventario click-select para Cromos / Chapería. */
window.PBTA_INV = (() => {
  const CAT = () => window.PBTA_CATALOGO;
  const STATS = ["en", "mc", "rc", "tm"];

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function uid() {
    return `i${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  }

  function defOf(item) {
    return item?.catalogId ? CAT()?.get(item.catalogId) : null;
  }

  function qualityLabel(q) {
    return CAT()?.Q_LABEL?.[q] || q || "";
  }

  function qualityShort(q) {
    return CAT()?.Q_SHORT?.[q] || qualityLabel(q);
  }

  function saiCap(def, quality) {
    if (!def?.saiSlots) return 0;
    return def.saiSlots[quality] ?? 0;
  }

  function moduleCap(def, quality) {
    if (!def?.moduleSlots) return 0;
    return def.moduleSlots[quality] ?? 0;
  }

  function createItem(catalogId, quality) {
    const def = CAT()?.get(catalogId);
    if (!def) return null;
    const q = def.lockedQuality || quality || (def.hasQuality === false ? null : "corr");
    return {
      id: uid(),
      catalogId,
      quality: q,
      accessories: [],
      sai: [],
      modules: [],
      ballistics: [],
      attached: def.column === "cromos" && def.attachable !== false,
      appliedStats: {},
      arsenalFixed: false,
      arsenalChoice: false,
    };
  }

  /**
   * Una línea: texto completo si cabe; si no, resume (calidad corta → short → …).
   */
  function formatItem(item, maxCh) {
    const def = defOf(item);
    if (!def) return String(item?.label || "");
    const lim = maxCh || 40;

    if (item.kind === "sub") {
      let label = String(item.label || "");
      if (label.length > lim) label = `${label.slice(0, lim - 1)}…`;
      return label;
    }

    const fullName = String(def.name || "").trim();
    const shortName = String(def.short || "").trim();
    const useShort = shortName && shortName !== fullName;
    const hasQ = def.hasQuality !== false && item.quality;
    const qFull = hasQ ? qualityLabel(item.quality) : "";
    const qAbr = hasQ ? qualityShort(item.quality) : "";

    const decorate = (core) => {
      let s = core;
      if (/^granada-/.test(def.id || "") || /^granada\b/i.test(def.name || "")) {
        s = `% ${s}`;
      }
      if (def.attachable && item.attached === false) s = `${s} ·OFF`;
      const fixed = (item.arsenalInitial && item.arsenalFixedLabels) || [];
      if (fixed.length) s = `${fixed.filter(Boolean).join(", ")}, ${s}`;
      return s;
    };

    const variants = [];
    const push = (core) => {
      const s = decorate(core);
      if (s && !variants.includes(s)) variants.push(s);
    };

    if (hasQ) {
      push(`${fullName} [${qFull}]`);
      push(`${fullName} [${qAbr}]`);
      if (useShort) {
        push(`${shortName} [${qFull}]`);
        push(`${shortName} [${qAbr}]`);
      }
    } else {
      push(fullName);
      if (useShort) push(shortName);
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
   * ¤ SAI · + accesorio/módulo/subsistema · » balística · % granada
   */
  const SUB_MARK = {
    sai: "¤ ",
    acc: "+ ",
    mod: "+ ",
    bal: "» ",
    sub: "+ ",
  };

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
    return out;
  }

  function isParentItem(item) {
    if (!item || item.kind === "sub") return false;
    return !!(item.catalogId || String(item.label || "").trim());
  }

  function collectParents(form, ledger) {
    const parents = [];
    form.querySelectorAll(`.ficha-inv-row[data-ledger="${ledger}"]`).forEach((row) => {
      const item = parseSlot(row.querySelector('input[data-inv="1"]')?.value);
      if (!isParentItem(item)) return;
      parents.push(item);
    });
    parents.sort((a, b) => Number(!!b.arsenalInitial) - Number(!!a.arsenalInitial));
    return parents;
  }

  function linesForParents(parents) {
    return parents.reduce((n, p) => n + 1 + listItemSubs(p).length, 0);
  }

  function packLedger(form, ledger, maxRows, refreshInvRow) {
    if (!form || !ledger) return true;
    const parents = collectParents(form, ledger);
    const lines = [];
    for (const p of parents) {
      lines.push({ type: "parent", item: p });
      for (const s of listItemSubs(p)) lines.push({ type: "sub", item: s });
    }
    if (lines.length > maxRows) return false;

    const rows = [...form.querySelectorAll(`.ficha-inv-row[data-ledger="${ledger}"]`)];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const input = row.querySelector('input[data-inv="1"]');
      if (!input) continue;
      const line = lines[i];
      if (!line) {
        input.value = "";
        row.classList.remove("is-sub");
        delete row.dataset.parentId;
        delete row.dataset.subKind;
      } else if (line.type === "parent") {
        input.value = serializeSlot(line.item);
        row.classList.remove("is-sub");
        delete row.dataset.parentId;
        delete row.dataset.subKind;
      } else {
        input.value = serializeSlot(line.item);
        row.classList.add("is-sub");
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
    return linesForParents(parents) <= maxRows;
  }

  function wouldFitNewParent(form, ledger, maxRows) {
    return linesForParents(collectParents(form, ledger)) + 1 <= maxRows;
  }

  function statsFor(item) {
    if (item?.kind === "sub") return {};
    const def = defOf(item);
    if (!def || !item?.attached) return {};
    const q = item.quality || "impro";
    return { ...(def.statsByQuality?.[q] || {}) };
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
      (body ? `<div class="ficha-inv-tip-body">${esc(body)}</div>` : "")
    );
  }

  function tipLine(label, value) {
    if (!value) return "";
    return `<div class="ficha-inv-tip-line"><span class="ficha-inv-tip-k">${esc(label)}</span> ${esc(value)}</div>`;
  }

  function formatStatMap(st) {
    if (!st || typeof st !== "object") return "";
    return Object.entries(st)
      .filter(([, v]) => Number(v))
      .map(([k, v]) => `${v > 0 ? "+" : ""}${v} ${String(k).toUpperCase()}`)
      .join(", ");
  }

  function statsByQualityText(sq) {
    if (!sq) return "";
    const Q = CAT()?.Q || [];
    return Q.map((q) => {
      const line = formatStatMap(sq[q]);
      return line ? `${qualityLabel(q)}: ${line}` : "";
    })
      .filter(Boolean)
      .join("\n");
  }

  function buildDefTipHtml(def) {
    if (!def) return tipBlock("—", "Sin datos en catálogo.");
    const kind = KIND_LABEL[def.kind] || def.kind || "Ítem";
    let html = tipBlock(def.name || "Ítem", kind);
    if (def.detail) html += `<div class="ficha-inv-tip-body">${esc(def.detail)}</div>`;
    const sq = statsByQualityText(def.statsByQuality);
    if (sq) html += tipBlock("Bonos por calidad", sq);
    if (def.saiSlots) {
      const slots = (CAT()?.Q || [])
        .map((q) => `${qualityLabel(q)}:${def.saiSlots[q] ?? 0}`)
        .join(" · ");
      html += tipLine("SAI", slots);
    }
    if (def.moduleSlots) {
      const slots = (CAT()?.Q || [])
        .map((q) => `${qualityLabel(q)}:${def.moduleSlots[q] ?? 0}`)
        .join(" · ");
      html += tipLine("Módulos", slots);
    }
    if (def.attachable) html += tipLine("Acoplable", "Sí (cromo)");
    if (def.countsAsCromo === false && def.kind === "cromo") {
      html += tipLine("@Psique", "No cuenta como cromo");
    }
    return html;
  }

  function buildOptionTipHtml(kind, opt) {
    if (!opt) return tipBlock("—", "");
    const title =
      kind === "sai"
        ? "SAI"
        : kind === "acc"
          ? "Accesorio"
          : kind === "bal"
            ? "Balística especial"
            : kind === "mod"
              ? "Módulo"
              : "Opción";
    let html = tipBlock(opt.name || "—", title);
    if (opt.detail) html += `<div class="ficha-inv-tip-body">${esc(opt.detail)}</div>`;
    else html += `<div class="ficha-inv-tip-body muted">Sin ficha ampliada.</div>`;
    return html;
  }

  function buildItemTipHtml(item) {
    const def = defOf(item);
    if (!def) {
      const label = String(item?.label || "").trim();
      return tipBlock(label || "Nota", "Texto libre en inventario.");
    }
    let html = buildDefTipHtml(def);
    if (def.hasQuality !== false && item.quality) {
      html += tipLine("Calidad actual", qualityLabel(item.quality));
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
    const sais = named(item.sai, def.sai, "SAI·");
    const bals = named(item.ballistics, def.ballistics, "Bal·");
    const mods = named(item.modules, def.modules, "");
    if (accs.length) html += tipBlock("Accesorios", accs.join("\n"));
    if (sais.length) html += tipBlock("SAI montados", sais.join("\n"));
    if (bals.length) html += tipBlock("Balística especial", bals.join("\n"));
    if (mods.length) html += tipBlock("Módulos", mods.join("\n"));
    if (item.arsenalInitial) {
      const fixed = (item.arsenalFixedLabels || []).filter(Boolean);
      html += tipLine(
        "Arsenal inicial",
        fixed.length ? `Fijos: ${fixed.join(", ")}` : "Arma de profesión"
      );
    }
    html += `<div class="ficha-inv-tip-foot">Solo lectura · clic para editar</div>`;
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
      return buildOptionTipHtml("acc", opt || { name: btn.textContent.trim() });
    }
    if (btn.dataset.sai) {
      const opt = (def?.sai || []).find((x) => x.id === btn.dataset.sai);
      return buildOptionTipHtml("sai", opt || { name: btn.textContent.trim() });
    }
    if (btn.dataset.bal) {
      const opt = (def?.ballistics || []).find((x) => x.id === btn.dataset.bal);
      return buildOptionTipHtml("bal", opt || { name: btn.textContent.trim() });
    }
    if (btn.dataset.mod) {
      const opt = (def?.modules || []).find((x) => x.id === btn.dataset.mod);
      return buildOptionTipHtml("mod", opt || { name: btn.textContent.trim() });
    }
    if (btn.dataset.quality) {
      return tipBlock(
        `Calidad ${qualityLabel(btn.dataset.quality)}`,
        def?.saiSlots
          ? `SAI disponibles: ${def.saiSlots[btn.dataset.quality] ?? 0}`
          : def?.detail || ""
      );
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
        if (kind === "sai") opt = (def?.sai || []).find((x) => x.id === item.subId);
        if (kind === "bal") opt = (def?.ballistics || []).find((x) => x.id === item.subId);
        if (kind === "mod") opt = (def?.modules || []).find((x) => x.id === item.subId);
        return (
          buildOptionTipHtml(kind || "acc", opt || { name: item.label || "Subítem" }) +
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

  function buildCatalogMenuHtml(column) {
    const sections = CAT()?.sections?.[column] || [];
    return sections
      .map((sec) => {
        const head = `<div class="ficha-inv-sec" role="presentation">${esc(sec.title)}</div>`;
        const opts = sec.items
          .map(
            (it) =>
              `<button type="button" class="ficha-inv-opt" data-add="${esc(it.id)}">${esc(it.name)}</button>`
          )
          .join("");
        return head + opts;
      })
      .join("");
  }

  function buildItemMenuHtml(item) {
    const def = defOf(item);
    if (!def) {
      return `<button type="button" class="ficha-inv-opt" data-act="delete">Eliminar</button>`;
    }
    const lockedQ = !!def.lockedQuality || item.arsenalFixed;
    const qRow =
      def.hasQuality === false
        ? ""
        : `<div class="ficha-inv-sec">Calidad</div>` +
          `<div class="ficha-inv-quality" role="group" aria-label="Calidad">` +
          (CAT()?.Q || [])
            .map((q) => {
              const on = item.quality === q;
              const dis = lockedQ ? " disabled" : "";
              return (
                `<button type="button" class="ficha-inv-q${on ? " is-on" : ""}" data-quality="${q}"${dis} aria-pressed="${on}">` +
                `<span class="ficha-inv-q-box">[${on ? "×" : " "}]</span>` +
                `<span class="ficha-inv-q-lab">${qualityLabel(q)}</span>` +
                `</button>`
              );
            })
            .join("") +
          `</div>`;

    const accList = def.accessories || [];
    const modList = def.modules || [];
    const saiList = def.sai || [];
    const balList = def.ballistics || [];
    const capSai = saiCap(def, item.quality);
    const capMod = moduleCap(def, item.quality);

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
      : `<button type="button" class="ficha-inv-opt ficha-inv-danger" data-act="delete">Eliminar</button>`;

    return qRow + extras + attachBtn + changeArsenal + deleteBtn;
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

    const repack = () => packLedgers(form, LEDGER_ROWS || 30, refreshInvRow);

    form.addEventListener("click", (ev) => {
      hideTip();
      const t = ev.target;
      if (!(t instanceof Element)) return;

      if (t.closest(".ficha-inv-menu")) {
        handleMenuClick(ev, { ...ctx, repack });
        return;
      }

      const trigger = t.closest(".ficha-inv-trigger");
      if (!trigger || !form.contains(trigger)) return;
      if (trigger.disabled) return;
      ev.preventDefault();
      ev.stopPropagation();

      let row = trigger.closest(".ficha-inv-row");
      if (!row) return;

      // Subítem → menú del padre
      if (row.classList.contains("is-sub")) {
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

      const input = row.querySelector('input[data-inv="1"]');
      const column = row.dataset.ledger;
      const raw = String(input?.value || "");
      const item = parseSlot(raw);
      const empty = !raw.trim() || (!item?.catalogId && !(item?.label || "").trim()) || item?.kind === "sub";
      if (empty) {
        const choices = ctx.getArsenalChoices?.() || [];
        if (row.dataset.arsenalSlot === "1" && choices.length) {
          menu.innerHTML = buildArsenalChangeMenuHtml(choices, "");
        } else {
          menu.innerHTML = buildCatalogMenuHtml(column);
        }
      } else if (!item?.catalogId) {
        menu.innerHTML = `<button type="button" class="ficha-inv-opt ficha-inv-danger" data-act="delete">Eliminar</button>`;
      } else {
        menu.innerHTML = buildItemMenuHtml(item);
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
        quality = "corr";
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

    if (btn.dataset.quality) {
      const def = defOf(item);
      if (def?.lockedQuality || item.arsenalFixed) return;
      item.quality = btn.dataset.quality;
      const cap = saiCap(def, item.quality);
      if ((item.sai || []).length > cap) item.sai = item.sai.slice(0, cap);
      const mcap = moduleCap(def, item.quality);
      if (mcap > 0 && (item.modules || []).length > mcap) item.modules = item.modules.slice(0, mcap);
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
    formatItem,
    parseSlot,
    serializeSlot,
    statsFor,
    defOf,
    bindInventory,
    closeMenus,
    qualityLabel,
    packLedgers,
    packLedger,
    listItemSubs,
  };
})();
