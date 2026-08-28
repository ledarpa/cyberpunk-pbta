/** Auth jugador + personajes en nube + guardado explícito. */
(() => {
  const ACTIVE_KEY = "pbta-active-character";
  const EMPTY_NAME = "Sin nombre";
  const FICHA = () => window.PBTA_FICHA;

  let user = null; // { username } | null
  let characters = []; // { id, name, updatedAt }
  let activeId = null;
  let saving = false;

  const els = {
    badge: null,
    authBtn: null,
    logoutBtn: null,
    charWrap: null,
    charTrigger: null,
    charMenu: null,
    saveBtn: null,
    newBtn: null,
    deleteBtn: null,
    status: null,
    authModal: null,
    dirtyModal: null,
    deleteModal: null,
  };

  async function api(path, { method = "GET", body } = {}) {
    const opts = {
      method,
      credentials: "include",
      headers: {},
    };
    if (body !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(path, opts);
    const raw = await res.text();
    let data = null;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = null;
    }
    if (!res.ok) {
      let msg = (data && data.error) || res.statusText || "Error";
      if (/Unsupported method|NOT_IMPLEMENTED|Error code: 501/i.test(raw)) {
        msg =
          "La API no está disponible en este servidor local. Usá https://cyberpunk-pbta.vercel.app o corré: npx vercel dev --listen 9876";
      } else if (!data && raw && /<html/i.test(raw)) {
        msg = "Respuesta no válida del servidor (¿servidor estático sin /api?)";
      }
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function isLoggedIn() {
    return !!user;
  }

  function displayName(raw) {
    const n = String(raw ?? "").trim();
    return n || EMPTY_NAME;
  }

  function sheetNombre() {
    const form = document.getElementById("ficha-form");
    const el = form?.elements?.namedItem?.("nombre");
    if (el && "value" in el) return String(el.value || "").trim();
    const sheet = FICHA()?.collect?.();
    return String(sheet?.nombre || "").trim();
  }

  function nameFromSheet(sheet) {
    if (sheet && typeof sheet === "object") return displayName(sheet.nombre);
    return displayName(sheet);
  }

  function setStatus(text, kind = "") {
    if (!els.status) return;
    els.status.textContent = text || "";
    els.status.dataset.kind = kind;
  }

  function placeCharMenu() {
    if (!els.charMenu || !els.charTrigger || els.charMenu.hidden) return;
    const rect = els.charTrigger.getBoundingClientRect();
    const width = Math.max(rect.width, 8 * 16);
    let left = rect.left;
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - width - 8);
    }
    els.charMenu.style.minWidth = `${Math.round(width)}px`;
    els.charMenu.style.left = `${Math.round(left)}px`;
    els.charMenu.style.top = `${Math.round(rect.bottom + 4)}px`;
  }

  function closeCharMenu() {
    if (!els.charMenu || !els.charTrigger) return;
    els.charMenu.hidden = true;
    els.charTrigger.setAttribute("aria-expanded", "false");
  }

  function openCharMenu() {
    if (!els.charMenu || !els.charTrigger) return;
    fillCharMenu();
    els.charMenu.hidden = false;
    els.charTrigger.setAttribute("aria-expanded", "true");
    placeCharMenu();
  }

  function syncAuthChrome() {
    if (els.badge) {
      els.badge.textContent = user ? user.username : "Anónimo";
      els.badge.dataset.mode = user ? "player" : "guest";
    }
    if (els.authBtn) els.authBtn.hidden = !!user;
    if (els.logoutBtn) els.logoutBtn.hidden = !user;
    if (els.charWrap) els.charWrap.hidden = !user;
    if (els.newBtn) els.newBtn.hidden = !user;
    if (els.deleteBtn) els.deleteBtn.hidden = !user || !activeId;
    if (els.status) els.status.hidden = !user;
    if (!user) closeCharMenu();
    FICHA()?.setJugadorAccount?.(user?.username || null);
    syncSaveButton();
    syncCharTrigger();
  }

  function syncSaveButton() {
    const dirty = !!FICHA()?.isDirty?.();
    if (els.saveBtn) {
      els.saveBtn.hidden = !user;
      els.saveBtn.disabled = !user || !activeId || !dirty || saving;
    }
    if (!user) {
      setStatus("");
      return;
    }
    if (saving) setStatus("Guardando…", "busy");
    else if (dirty) setStatus("Sin guardar", "dirty");
    else setStatus("Guardado", "clean");
  }

  function syncCharTrigger() {
    if (!els.charTrigger) return;
    const active = characters.find((c) => c.id === activeId);
    const label = activeId ? displayName(active?.name ?? sheetNombre()) : EMPTY_NAME;
    els.charTrigger.textContent = label;
  }

  function fillCharMenu() {
    if (!els.charMenu) return;
    els.charMenu.replaceChildren();
    for (const c of characters) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "player-char-opt";
      btn.setAttribute("role", "option");
      btn.dataset.id = c.id;
      btn.textContent = displayName(c.name);
      btn.setAttribute("aria-selected", String(c.id === activeId));
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        closeCharMenu();
        onSwitchCharacter(c.id);
      });
      els.charMenu.appendChild(btn);
    }
  }

  function syncNombreFromSheetLive() {
    if (!user || !activeId) return;
    const nombre = sheetNombre();
    const label = displayName(nombre);
    const idx = characters.findIndex((c) => c.id === activeId);
    if (idx >= 0) characters[idx].name = label;
    syncCharTrigger();
    if (!els.charMenu?.hidden) fillCharMenu();
  }

  function rememberActive(id) {
    activeId = id;
    try {
      if (id) localStorage.setItem(ACTIVE_KEY, id);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch {
      /* ignore */
    }
  }

  function preferredActiveId(list) {
    let pref = null;
    try {
      pref = localStorage.getItem(ACTIVE_KEY);
    } catch {
      pref = null;
    }
    if (pref && list.some((c) => c.id === pref)) return pref;
    return list[0]?.id || null;
  }

  async function refreshCharacters() {
    const data = await api("/api/characters");
    characters = (data.characters || []).map((c) => ({
      ...c,
      name: displayName(c.name),
    }));
    fillCharMenu();
    syncCharTrigger();
  }

  async function loadCharacter(id) {
    const data = await api(`/api/characters/${encodeURIComponent(id)}`);
    const ch = data.character;
    const sheet = ch.sheet && typeof ch.sheet === "object" ? ch.sheet : {};
    const label = nameFromSheet(sheet);
    rememberActive(ch.id);
    const idx = characters.findIndex((c) => c.id === ch.id);
    if (idx >= 0) characters[idx] = { id: ch.id, name: label, updatedAt: ch.updatedAt };
    else characters.unshift({ id: ch.id, name: label, updatedAt: ch.updatedAt });
    FICHA()?.applySheet?.(sheet);
    FICHA()?.markClean?.();
    fillCharMenu();
    syncCharTrigger();
    syncSaveButton();
    if (els.deleteBtn) els.deleteBtn.hidden = !user || !activeId;
    return ch;
  }

  async function ensurePlayerSheet() {
    await refreshCharacters();
    if (!characters.length) {
      const created = await api("/api/characters", {
        method: "POST",
        body: { name: EMPTY_NAME, sheet: {} },
      });
      characters = [
        {
          id: created.character.id,
          name: EMPTY_NAME,
          updatedAt: created.character.updatedAt,
        },
      ];
      rememberActive(created.character.id);
      FICHA()?.applySheet?.(created.character.sheet || {});
      FICHA()?.markClean?.();
      fillCharMenu();
      syncCharTrigger();
      syncSaveButton();
      if (els.deleteBtn) els.deleteBtn.hidden = !user || !activeId;
      return;
    }
    const id = preferredActiveId(characters);
    await loadCharacter(id);
  }

  async function saveActive() {
    if (!user || !activeId || !FICHA()) return false;
    saving = true;
    syncSaveButton();
    try {
      const sheet = FICHA().collect();
      const name = nameFromSheet(sheet);
      const data = await api(`/api/characters/${encodeURIComponent(activeId)}`, {
        method: "PUT",
        body: { name, sheet },
      });
      const ch = data.character;
      const idx = characters.findIndex((c) => c.id === ch.id);
      const label = nameFromSheet(ch.sheet || sheet);
      if (idx >= 0) characters[idx] = { id: ch.id, name: label, updatedAt: ch.updatedAt };
      else characters.unshift({ id: ch.id, name: label, updatedAt: ch.updatedAt });
      fillCharMenu();
      syncCharTrigger();
      FICHA().markClean();
      return true;
    } finally {
      saving = false;
      syncSaveButton();
    }
  }

  function openModal(el) {
    if (!el) return;
    el.hidden = false;
  }

  function closeModal(el) {
    if (!el) return;
    el.hidden = true;
  }

  function confirmDiscard() {
    return new Promise((resolve) => {
      if (!FICHA()?.isDirty?.()) {
        resolve("proceed");
        return;
      }
      if (!user) {
        resolve("proceed");
        return;
      }
      const modal = els.dirtyModal;
      if (!modal) {
        resolve(window.confirm("Hay cambios sin guardar. ¿Descartar?") ? "discard" : "cancel");
        return;
      }
      openModal(modal);
      const onSave = async () => {
        cleanup();
        try {
          await saveActive();
          resolve("proceed");
        } catch (err) {
          setStatus(err.message || "Error al guardar", "error");
          resolve("cancel");
        }
      };
      const onDiscard = () => {
        cleanup();
        resolve("discard");
      };
      const onCancel = () => {
        cleanup();
        resolve("cancel");
      };
      function cleanup() {
        modal.querySelector("[data-dirty-save]")?.removeEventListener("click", onSave);
        modal.querySelector("[data-dirty-discard]")?.removeEventListener("click", onDiscard);
        modal.querySelector("[data-dirty-cancel]")?.removeEventListener("click", onCancel);
        closeModal(modal);
      }
      modal.querySelector("[data-dirty-save]")?.addEventListener("click", onSave);
      modal.querySelector("[data-dirty-discard]")?.addEventListener("click", onDiscard);
      modal.querySelector("[data-dirty-cancel]")?.addEventListener("click", onCancel);
    });
  }

  async function gateDirty({ onDiscard } = {}) {
    const action = await confirmDiscard();
    if (action === "cancel") return false;
    if (action === "discard") {
      if (typeof onDiscard === "function") await onDiscard();
    }
    return true;
  }

  async function restoreActiveOrReset() {
    if (user && activeId) {
      try {
        await loadCharacter(activeId);
        return;
      } catch {
        /* fall through */
      }
    }
    FICHA()?.resetSheet?.();
  }

  async function logout() {
    if (!(await gateDirty({ onDiscard: () => {} }))) return;
    try {
      await api("/api/auth/logout", { method: "POST", body: {} });
    } catch {
      /* ignore */
    }
    user = null;
    characters = [];
    rememberActive(null);
    FICHA()?.setJugadorAccount?.(null);
    FICHA()?.resetSheet?.();
    syncAuthChrome();
    fillCharMenu();
  }

  async function loginOrRegister(mode) {
    const form = els.authModal?.querySelector("form");
    if (!form) return;
    const username = String(form.username.value || "").trim();
    const password = String(form.password.value || "");
    const errEl = els.authModal.querySelector("[data-auth-error]");
    if (errEl) errEl.textContent = "";
    try {
      const path = mode === "register" ? "/api/auth/register" : "/api/auth/login";
      const data = await api(path, { method: "POST", body: { username, password } });
      user = { username: data.username };
      closeModal(els.authModal);
      form.reset();
      syncAuthChrome();
      await ensurePlayerSheet();
    } catch (err) {
      if (errEl) errEl.textContent = err.message || "Error";
    }
  }

  function confirmDeleteCharacter() {
    return new Promise((resolve) => {
      const modal = els.deleteModal;
      const active = characters.find((c) => c.id === activeId);
      const label = displayName(active?.name ?? sheetNombre());
      if (!modal || !activeId) {
        resolve(
          window.confirm(
            `Vas a eliminar permanentemente «${label}». Esta acción es irreversible. ¿Continuar?`
          )
        );
        return;
      }
      const lead = modal.querySelector("[data-delete-char-lead]");
      if (lead) {
        lead.innerHTML =
          `Vas a eliminar permanentemente «<strong>${escapeHtml(label)}</strong>». ` +
          `Esta acción es <strong>irreversible</strong>: no se puede recuperar.`;
      }
      openModal(modal);
      const onConfirm = () => {
        cleanup();
        resolve(true);
      };
      const onCancel = () => {
        cleanup();
        resolve(false);
      };
      function cleanup() {
        modal.querySelector("[data-delete-char-confirm]")?.removeEventListener("click", onConfirm);
        modal.querySelector("[data-delete-char-cancel]")?.removeEventListener("click", onCancel);
        closeModal(modal);
      }
      modal.querySelector("[data-delete-char-confirm]")?.addEventListener("click", onConfirm);
      modal.querySelector("[data-delete-char-cancel]")?.addEventListener("click", onCancel);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function onDeleteCharacter() {
    if (!user || !activeId) return;
    const id = activeId;
    if (!(await confirmDeleteCharacter())) return;
    try {
      await api(`/api/characters/${encodeURIComponent(id)}`, { method: "DELETE" });
      characters = characters.filter((c) => c.id !== id);
      if (!characters.length) {
        rememberActive(null);
        const data = await api("/api/characters", {
          method: "POST",
          body: { name: EMPTY_NAME, sheet: {} },
        });
        characters = [
          {
            id: data.character.id,
            name: EMPTY_NAME,
            updatedAt: data.character.updatedAt,
          },
        ];
        rememberActive(data.character.id);
        FICHA()?.applySheet?.(data.character.sheet || {});
        FICHA()?.markClean?.();
      } else {
        const nextId = preferredActiveId(characters) || characters[0].id;
        await loadCharacter(nextId);
      }
      fillCharMenu();
      syncCharTrigger();
      syncAuthChrome();
      setStatus("Personaje eliminado", "clean");
    } catch (err) {
      setStatus(err.message || "Error al eliminar", "error");
    }
  }

  async function onNewCharacter() {
    if (!(await gateDirty({ onDiscard: restoreActiveOrReset }))) return;
    try {
      const data = await api("/api/characters", {
        method: "POST",
        body: { name: EMPTY_NAME, sheet: {} },
      });
      characters.unshift({
        id: data.character.id,
        name: EMPTY_NAME,
        updatedAt: data.character.updatedAt,
      });
      rememberActive(data.character.id);
      FICHA()?.applySheet?.(data.character.sheet || {});
      FICHA()?.markClean?.();
      fillCharMenu();
      syncCharTrigger();
      syncSaveButton();
      document.getElementById("ficha-form")?.elements?.namedItem?.("nombre")?.focus?.();
    } catch (err) {
      setStatus(err.message || "Error", "error");
    }
  }

  async function onSwitchCharacter(id) {
    if (!id || id === activeId) return;
    if (!(await gateDirty({ onDiscard: () => {} }))) {
      fillCharMenu();
      syncCharTrigger();
      return;
    }
    try {
      await loadCharacter(id);
    } catch (err) {
      setStatus(err.message || "Error", "error");
      fillCharMenu();
      syncCharTrigger();
    }
  }

  function bindUi() {
    els.badge = document.getElementById("player-badge");
    els.authBtn = document.getElementById("player-auth-btn");
    els.logoutBtn = document.getElementById("player-logout-btn");
    els.charWrap = document.getElementById("ficha-char-wrap");
    els.charTrigger = document.getElementById("ficha-char-trigger");
    els.charMenu = document.getElementById("ficha-char-menu");
    els.saveBtn = document.getElementById("ficha-save-btn");
    els.newBtn = document.getElementById("ficha-new-btn");
    els.deleteBtn = document.getElementById("ficha-delete-btn");
    els.status = document.getElementById("ficha-save-status");
    els.authModal = document.getElementById("auth-modal");
    els.dirtyModal = document.getElementById("dirty-modal");
    els.deleteModal = document.getElementById("delete-char-modal");

    els.authBtn?.addEventListener("click", () => {
      const errEl = els.authModal?.querySelector("[data-auth-error]");
      if (errEl) errEl.textContent = "";
      openModal(els.authModal);
      els.authModal?.querySelector('input[name="username"]')?.focus();
    });
    els.logoutBtn?.addEventListener("click", () => {
      logout();
    });
    els.authModal?.querySelector("[data-auth-close]")?.addEventListener("click", () => {
      closeModal(els.authModal);
    });
    els.authModal?.querySelector("[data-auth-login]")?.addEventListener("click", (ev) => {
      ev.preventDefault();
      loginOrRegister("login");
    });
    els.authModal?.querySelector("[data-auth-register]")?.addEventListener("click", (ev) => {
      ev.preventDefault();
      loginOrRegister("register");
    });
    els.authModal?.querySelector("form")?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      loginOrRegister("login");
    });

    els.saveBtn?.addEventListener("click", async () => {
      try {
        await saveActive();
      } catch (err) {
        setStatus(err.message || "Error al guardar", "error");
      }
    });
    els.newBtn?.addEventListener("click", () => onNewCharacter());
    els.deleteBtn?.addEventListener("click", () => onDeleteCharacter());

    els.charTrigger?.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (!user) return;
      if (els.charMenu?.hidden) openCharMenu();
      else closeCharMenu();
    });

    document.addEventListener("click", (ev) => {
      if (!els.charWrap || els.charMenu?.hidden) return;
      if (ev.target instanceof Node && els.charWrap.contains(ev.target)) return;
      if (ev.target instanceof Node && els.charMenu.contains(ev.target)) return;
      closeCharMenu();
    });
    window.addEventListener("resize", () => placeCharMenu());
    window.addEventListener("scroll", () => placeCharMenu(), true);

    document.getElementById("ficha-form")?.addEventListener("input", (ev) => {
      const t = ev.target;
      if (t instanceof HTMLInputElement && t.name === "nombre") {
        syncNombreFromSheetLive();
      }
    });

    FICHA()?.onDirtyChange?.(() => syncSaveButton());

    window.addEventListener("beforeunload", (ev) => {
      if (user && FICHA()?.isDirty?.()) {
        ev.preventDefault();
        ev.returnValue = "";
      }
    });

    syncAuthChrome();
  }

  async function boot() {
    bindUi();
    try {
      const me = await api("/api/auth/me");
      user = { username: me.username };
      syncAuthChrome();
      await ensurePlayerSheet();
    } catch {
      user = null;
      syncAuthChrome();
      FICHA()?.resetSheet?.();
    }
  }

  window.PBTA_PLAYER = {
    isLoggedIn,
    gateDirty,
    restoreActiveOrReset,
    saveActive,
    boot,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
