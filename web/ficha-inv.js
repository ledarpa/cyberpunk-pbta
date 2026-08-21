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
      attached: def.column === "cromos" && def.attachable !== false,
      appliedStats: {},
      arsenalFixed: false,
      arsenalChoice: false,
    };
  }

  function formatItem(item, maxCh) {
    const def = defOf(item);
    if (!def) return String(item?.label || "");
    const name = def.short || def.name;
    let core = name;
    if (def.hasQuality !== false && item.quality) {
      core = `${name} [${qualityLabel(item.quality)}]`;
    }
    const extras = [];
    for (const id of item.accessories || []) {
      const a = (def.accessories || []).find((x) => x.id === id);
      if (a) extras.push(`+${a.short || a.name}`);
    }
    for (const id of item.sai || []) {
      const s = (def.sai || []).find((x) => x.id === id);
      if (s) extras.push(`+SAI·${s.short || s.name}`);
    }
    for (const id of item.modules || []) {
      const m = (def.modules || []).find((x) => x.id === id);
      if (m) extras.push(`+${m.short || m.name}`);
    }
    if (def.attachable && item.attached === false) extras.push("·OFF");

    const fixed = (item.arsenalInitial && item.arsenalFixedLabels) || [];
    const tail = [core, ...extras].join(" ");
    let label = fixed.length ? `${fixed.filter(Boolean).join(", ")}, ${tail}` : tail;
    const lim = maxCh || 40;
    if (label.length > lim) label = `${label.slice(0, lim - 1)}…`;
    return label;
  }

  function statsFor(item) {
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
    const { form, saveSheet, syncTypedCover, applyInventoryStats, LEDGER_ROWS } = ctx;
    if (!form || !CAT()) return;

    form.addEventListener("click", (ev) => {
      const t = ev.target;
      if (!(t instanceof Element)) return;

      if (t.closest(".ficha-inv-menu")) {
        handleMenuClick(ev, ctx);
        return;
      }

      const trigger = t.closest(".ficha-inv-trigger");
      if (!trigger || !form.contains(trigger)) return;
      if (trigger.disabled) return;
      ev.preventDefault();
      ev.stopPropagation();

      const row = trigger.closest(".ficha-inv-row");
      if (!row) return;
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
      const empty = !raw.trim() || (!item?.catalogId && !(item?.label || "").trim());
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
      trigger.setAttribute("aria-expanded", "true");
      // Asegurar scroll con rueda/trackpad aunque el panel padre capture wheel
      if (!menu.dataset.wheelBound) {
        menu.dataset.wheelBound = "1";
        menu.addEventListener(
          "wheel",
          (ev) => {
            if (menu.scrollHeight <= menu.clientHeight + 1) return;
            const atTop = menu.scrollTop <= 0;
            const atBottom = menu.scrollTop + menu.clientHeight >= menu.scrollHeight - 1;
            if ((ev.deltaY < 0 && atTop) || (ev.deltaY > 0 && atBottom)) return;
            ev.stopPropagation();
          },
          { passive: true }
        );
      }

    document.addEventListener("click", (ev) => {
      if (!(ev.target instanceof Node)) return;
      if (form.contains(ev.target) && ev.target.closest?.(".ficha-inv-row")) return;
      closeMenus(form);
    });
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
    } = ctx;
    const btn = ev.target.closest("button");
    if (!btn || !form.contains(btn)) return;
    ev.preventDefault();
    ev.stopPropagation();

    const row = btn.closest(".ficha-inv-row");
    const input = row?.querySelector('input[data-inv="1"]');
    const menu = row?.querySelector(".ficha-inv-menu");
    if (!row || !input) return;

    const addId = btn.dataset.add;
    if (addId) {
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
      refreshInvRow(row);
      applyInventoryStats();
      closeMenus(form);
      saveSheet();
      return;
    }

    if (btn.dataset.arsenalPick) {
      setArsenalChoice?.(btn.dataset.arsenalPick);
      closeMenus(form);
      return;
    }

    let item = parseSlot(input.value);
    if (!item) return;

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
      refreshInvRow(row);
      applyInventoryStats();
      if (menu) menu.innerHTML = buildItemMenuHtml(item);
      placeMenu(menu, row);
      saveSheet();
      return;
    }

    if (btn.dataset.acc) {
      const id = btn.dataset.acc;
      const set = new Set(item.accessories || []);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      item.accessories = [...set];
      input.value = serializeSlot(item);
      refreshInvRow(row);
      if (menu) menu.innerHTML = buildItemMenuHtml(item);
      placeMenu(menu, row);
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
      }
      item.sai = [...set];
      input.value = serializeSlot(item);
      refreshInvRow(row);
      if (menu) menu.innerHTML = buildItemMenuHtml(item);
      placeMenu(menu, row);
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
      }
      item.modules = [...set];
      input.value = serializeSlot(item);
      refreshInvRow(row);
      if (menu) menu.innerHTML = buildItemMenuHtml(item);
      placeMenu(menu, row);
      saveSheet();
      return;
    }

    if (btn.dataset.act === "toggle-attach") {
      item.attached = item.attached === false;
      input.value = serializeSlot(item);
      refreshInvRow(row);
      applyInventoryStats();
      if (menu) menu.innerHTML = buildItemMenuHtml(item);
      placeMenu(menu, row);
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
      refreshInvRow(row);
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
  };
})();
