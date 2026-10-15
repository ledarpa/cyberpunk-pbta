(() => {
  const book = document.getElementById("book");
  const tocEl = document.getElementById("toc");
  const reader = document.getElementById("reader");
  const fichaPanel = document.getElementById("ficha-panel");
  const aventurasPanel = document.getElementById("aventuras-panel");
  const aventurasBook = document.getElementById("aventuras-book");
  const q = document.getElementById("q");
  const meta = document.getElementById("search-meta");
  const prevBtn = document.getElementById("search-prev");
  const nextBtn = document.getElementById("search-next");
  const toggle = document.getElementById("toc-toggle");
  const scrim = document.getElementById("scrim");
  const sidebar = document.getElementById("sidebar");

  const FICHA_ID = "hoja-personaje";
  const AVENTURAS_ID = "aventuras";
  const AVENTURA_PREFIX = "aventura:";
  const LANG_KEY = "pbta-lang";
  const MANUALS = {
    es: window.PBTA_MANUAL,
    en: window.PBTA_MANUAL_EN || window.PBTA_MANUAL,
  };
  const I18N = {
    es: {
      tocToggle: "Índice",
      searchLabel: "Buscar en el manual",
      placeholder: "Buscar...",
      prev: "Anterior",
      next: "Siguiente",
      coverSub: "MANUAL DE REGLAS",
      ficha: "Hoja de personaje",
      aventuras: "Aventuras",
    },
    en: {
      tocToggle: "Contents",
      searchLabel: "Search the manual",
      placeholder: "Search...",
      prev: "Previous",
      next: "Next",
      coverSub: "RULEBOOK",
      ficha: "Character sheet",
      aventuras: "Adventures",
    },
  };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };
  // Idioma: preferencia guardada → autodetección del navegador (lógica única en PBTA_I18N).
  let lang = window.PBTA_I18N?.lang() ?? "es";
  let data = MANUALS[lang] || MANUALS.es;
  let manualScrollTop = 0;
  let headingObserver = null;
  let aventurasObserver = null;

  if (!data || !book) {
    document.body.innerHTML = "<p style='padding:2rem'>Falta data/manual.js. Ejecutá docs/scripts/build_web_reader.py</p>";
    return;
  }

  const t = () => I18N[lang] || I18N.es;

  /** Render completo del manual (idioma activo): DOM + TOC + arte + observer. */
  function renderBook() {
    book.innerHTML = data.html;
    renderAventurasBook();
    renderToc(data.toc || []);
    bindBookArt();
    runArtLayout();
    if (!isPanelView()) observeHeadings();
  }

  /** Libro de aventuras: mismo conversor que el manual, ids «av-» propios. */
  function renderAventurasBook() {
    if (!aventurasBook) return;
    const scroll = aventurasPanel ? aventurasPanel.scrollTop : 0;
    const av = window.PBTA_AVENTURAS;
    aventurasBook.innerHTML = (av?.items ?? [])
      .map((it) => `<article class="chapter" data-aventura="${it.id}">${it.html}</article>`)
      .join("");
    if (aventurasPanel) aventurasPanel.scrollTop = scroll;
  }

  renderBook();
  loadCover();
  bindNav();
  bindSearch();
  bindChrome();
  bindLangSwitch();
  bindReaderScroll();
  syncReaderViewport();
  syncFichaViewport();
  applyChromeStrings();
  openFromHash();
  window.addEventListener("hashchange", openFromHash);
  function runArtLayoutPass() {
    window.PBTA_ART_LAYOUT.run(book);
  }

  function runArtLayout() {
    runArtLayoutPass();
    requestAnimationFrame(() => {
      runArtLayoutPass();
      requestAnimationFrame(runArtLayoutPass);
    });
  }

  let artLayoutTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(artLayoutTimer);
    artLayoutTimer = setTimeout(runArtLayoutPass, 60);
  });

  /** Listeners de load por dibujo: se re-ligan en cada render (DOM nuevo). */
  function bindBookArt() {
    window.PBTA_ART_LAYOUT.bind(book);
  }

  /** Texto ASCII de portada (cacheado en PBTA_LOGO: una sola fetch por sesión). */
  function fetchCoverAscii() {
    return window.PBTA_LOGO.loadText();
  }

  function fitAsciiArt(pre, boxW, boxH, baseSize) {
    if (!pre || !pre.textContent || !boxW) return;
    pre.style.transform = "none";
    const pad = Math.max(8, Math.round(boxW * 0.04));
    const maxW = Math.max(16, boxW - pad * 2);
    const maxH = Math.max(16, boxH);
    pre.style.fontSize = `${baseSize}px`;
    const artW = pre.scrollWidth;
    const artH = pre.scrollHeight;
    if (!artW || !artH) return;
    let px = Math.floor(baseSize * Math.min(maxW / artW, maxH / artH, 1));
    px = Math.max(5, px);
    pre.style.fontSize = `${px}px`;
    while (px > 5 && (pre.scrollWidth > maxW || pre.scrollHeight > maxH)) {
      px -= 1;
      pre.style.fontSize = `${px}px`;
    }
    if (window.PBTA_LOGO) window.PBTA_LOGO.fitPrompt(pre);
  }

  function loadCover() {
    const pre = document.getElementById("cover-art");
    const scene = document.getElementById("cover-scene");
    if (scene) {
      const v = window.PBTA_BUILD?.id || "";
      scene.src = `assets/manual/night_city.png${v ? `?v=${v}` : ""}`;
    }
    if (!pre) return;
    fetchCoverAscii()
      .then((text) => {
        if (window.PBTA_LOGO) window.PBTA_LOGO.paint(pre, text);
        else pre.textContent = text;
        fitCoverArt();
        requestAnimationFrame(fitCoverArt);
        fitTocCoverArt();
      })
      .catch(() => {
        const fallback = "PbtA:\\>";
        if (window.PBTA_LOGO) window.PBTA_LOGO.paint(pre, fallback);
        else pre.textContent = fallback;
        fitCoverArt();
      });

    const page = document.querySelector(".cover-page");
    if (page && "ResizeObserver" in window) {
      new ResizeObserver(() => fitCoverArt()).observe(page);
    }
    window.addEventListener("resize", fitCoverArt);
  }

  function fitCoverArt() {
    const pre = document.getElementById("cover-art");
    const frame = pre?.closest(".cover-art-frame");
    const page = pre?.closest(".cover-page");
    if (!pre || !frame || !page || !pre.textContent) return;
    const boxW = frame.clientWidth;
    const boxH = Math.max(32, page.clientHeight * 0.16);
    fitAsciiArt(pre, boxW, boxH, 40);
  }

  function renderToc(toc) {
    const frag = document.createDocumentFragment();
    const coverLink = document.createElement("a");
    coverLink.href = "#portada";
    coverLink.className = "l1 toc-cover";
    coverLink.dataset.id = "portada";
    const pre = document.createElement("pre");
    pre.className = "cover-art toc-cover-art";
    pre.setAttribute("aria-label", "Cyberpunk");
    coverLink.appendChild(pre);
    frag.appendChild(coverLink);
    for (const item of toc) {
      if (item.level > 3) continue;
      const a = document.createElement("a");
      a.href = `#${item.id}`;
      a.className = `l${item.level}`;
      a.textContent = item.title;
      a.dataset.id = item.id;
      frag.appendChild(a);
    }
    const fichaLink = document.createElement("a");
    fichaLink.href = `#${FICHA_ID}`;
    fichaLink.className = "l1 toc-ficha";
    fichaLink.textContent = t().ficha;
    fichaLink.dataset.id = FICHA_ID;
    frag.appendChild(fichaLink);
    const av = window.PBTA_AVENTURAS;
    if (av?.items?.length) {
      const aventurasLink = document.createElement("a");
      aventurasLink.href = `#${AVENTURAS_ID}`;
      aventurasLink.className = "l1 toc-aventuras";
      aventurasLink.textContent = t().aventuras;
      aventurasLink.dataset.id = AVENTURAS_ID;
      frag.appendChild(aventurasLink);
      for (const item of av.items) {
        const id = `${AVENTURA_PREFIX}${item.id}`;
        const a = document.createElement("a");
        a.href = `#${id}`;
        a.className = "l2 toc-aventura";
        a.textContent = item.title;
        a.dataset.id = id;
        frag.appendChild(a);
        for (const ch of item.children ?? []) {
          const c = document.createElement("a");
          c.href = `#${ch.id}`;
          c.className = "l3 toc-aventura-child";
          c.textContent = ch.title;
          c.dataset.id = ch.id;
          frag.appendChild(c);
        }
      }
    }
    tocEl.replaceChildren(frag);
    loadTocCoverAscii();
  }

  function loadTocCoverAscii() {
    const pre = tocEl.querySelector(".toc-cover-art");
    if (!pre) return;
    const paint = (text) => {
      if (window.PBTA_LOGO) window.PBTA_LOGO.paint(pre, text);
      else pre.textContent = text;
      fitTocCoverArt();
      requestAnimationFrame(fitTocCoverArt);
    };
    fetchCoverAscii()
      .then(paint)
      .catch(() => {
        paint("PbtA:\\>");
      });
    window.addEventListener("resize", fitTocCoverArt);
    if (sidebar && "ResizeObserver" in window) {
      new ResizeObserver(() => fitTocCoverArt()).observe(sidebar);
    }
  }

  function fitTocCoverArt() {
    const pre = tocEl.querySelector(".toc-cover-art");
    if (!pre || !pre.textContent || !sidebar) return;
    const boxW = Math.max(48, sidebar.clientWidth - 24);
    const boxH = 36;
    fitAsciiArt(pre, boxW, boxH, 10);
  }

  /** Spy de la vista aventuras: H1s del libro → ítems del sidebar.
   *  Orden del DOM = título de la aventura, luego sus children (misiones + PNJ). */
  function observeAventurasHeadings() {
    if (aventurasObserver) aventurasObserver.disconnect();
    if (!aventurasBook || !aventurasPanel || !("IntersectionObserver" in window)) return;
    const av = window.PBTA_AVENTURAS;
    const heads = [...aventurasBook.querySelectorAll("h1")];
    if (!av?.items?.length || !heads.length) return;
    const map = new Map();
    let idx = 0;
    for (const item of av.items) {
      if (heads[idx]) map.set(heads[idx++].id, `${AVENTURA_PREFIX}${item.id}`);
      for (const ch of item.children ?? []) {
        if (heads[idx]) map.set(heads[idx++].id, ch.id);
      }
    }
    let current = null;
    aventurasObserver = new IntersectionObserver(
      (entries) => {
        if (!isAventurasView()) return;
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const tid = vis.length ? map.get(vis[0].target.id) : current;
        if (!tid || tid === current) return;
        current = tid;
        for (const a of tocEl.querySelectorAll("a")) {
          a.classList.toggle("is-active", a.dataset.id === tid);
        }
        tocEl.querySelector(`a[data-id="${tid}"]`)?.scrollIntoView({ block: "nearest" });
      },
      { root: aventurasPanel, rootMargin: "0px 0px -72% 0px", threshold: [0, 1] }
    );
    heads.forEach((h) => aventurasObserver.observe(h));
  }

  /** Índice del último heading visible sobre el viewport (posición de lectura). */
  function currentHeadingIndex() {
    if (isPanelView()) return null;
    const heads = [...book.querySelectorAll("h1, h2, h3")];
    if (!heads.length) return null;
    const top = reader.getBoundingClientRect().top;
    // margen generoso: al cambiar de idioma conviene quedar un poco arriba
    const margin = Math.min(reader.clientHeight * 0.4, 300);
    let idx = -1;
    heads.forEach((h, i) => {
      if (h.getBoundingClientRect().top - top <= margin) idx = i;
    });
    return idx;
  }

  /** Restaura la posición de lectura tras un cambio de idioma (estructura 1:1). */
  function scrollToHeadingIndex(idx) {
    const heads = [...book.querySelectorAll("h1, h2, h3")];
    const el = idx != null && idx >= 0 ? heads[idx] : null;
    // scroll instantáneo: el swap de idioma no debe animar, y el smooth se
    // descarrila con lazy imgs cargando (mismo problema que showManualView).
    const prevBehavior = reader.style.scrollBehavior;
    reader.style.scrollBehavior = "auto";
    try {
      if (!el) {
        reader.scrollTop = 0;
        setActiveToc("portada");
        history.replaceState(null, "", "#portada");
        return;
      }
      // lazy imgs previas al destino: estabilizan el layout del scroll
      book.querySelectorAll("img[loading='lazy']").forEach((im) => {
        if (im.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) {
          im.loading = "eager";
        }
      });
      el.scrollIntoView({ block: "start" });
      setActiveToc(el.id);
      if (el.id) history.replaceState(null, "", `#${el.id}`);
    } finally {
      reader.style.scrollBehavior = prevBehavior;
    }
  }

  /** Strings del chrome según idioma activo (título, búsqueda, portada, modales). */
  function applyChromeStrings() {
    const s = t();
    document.documentElement.lang = lang;
    document.title = data.title || document.title;
    const toggleSr = toggle.querySelector(".sr-only");
    if (toggleSr) toggleSr.textContent = s.tocToggle;
    toggle.title = s.tocToggle;
    const searchSr = document.querySelector(".cli-prompt .sr-only");
    if (searchSr) searchSr.textContent = s.searchLabel;
    q.placeholder = s.placeholder;
    prevBtn.title = s.prev;
    nextBtn.title = s.next;
    const coverSub = document.getElementById("cover-sub-title");
    if (coverSub) coverSub.textContent = s.coverSub;
    window.PBTA_I18N?.applyDom?.();
    syncLangSwitch();
  }

  function syncLangSwitch() {
    const sel = document.getElementById("lang-switch");
    if (!sel) return;
    for (const btn of sel.querySelectorAll(".lang-btn")) {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    }
  }

  function bindLangSwitch() {
    const sel = document.getElementById("lang-switch");
    if (!sel) return;
    sel.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".lang-btn");
      if (!btn) return;
      setLanguage(btn.dataset.lang);
    });
  }

  /** Cambio de idioma: re-render del manual + chrome + posición por índice. */
  function setLanguage(next) {
    if (next !== "en" && next !== "es") return;
    if (next === lang) return;
    const idx = currentHeadingIndex();
    lang = next;
    store.set(LANG_KEY, lang);
    data = MANUALS[lang] || MANUALS.es;
    applyChromeStrings();
    renderBook();
    // Ficha + player chrome: re-render con el idioma activo
    window.PBTA_FICHA?.rebuild?.();
    window.PBTA_PLAYER?.syncAuthChrome?.();
    if (isFichaView()) {
      setActiveToc(FICHA_ID);
    } else if (isAventurasView()) {
      // El libro de aventuras no depende del idioma, pero renderBook() reemplazó
      // su DOM: reconectar el spy y refrescar el índice activo
      setActiveToc(AVENTURAS_ID);
      observeAventurasHeadings();
    } else {
      scrollToHeadingIndex(idx);
    }
    // búsqueda: el DOM se reemplazó → reset completo del estado
    q.value = "";
    meta.hidden = true;
    prevBtn.hidden = true;
    nextBtn.hidden = true;
    q.dispatchEvent(new Event("input"));
    requestAnimationFrame(clampReaderScroll);
  }

  function bindNav() {
    tocEl.addEventListener("click", (ev) => {
      const a = ev.target.closest("a");
      if (!a) return;
      ev.preventDefault();
      goToId(a.dataset.id);
      closeDrawer();
    });
  }

  function isFichaView() {
    return document.body.classList.contains("view-ficha");
  }

  function isAventurasView() {
    return document.body.classList.contains("view-aventuras");
  }

  /** Cualquier pantalla no-manual (ficha, aventuras): sin observer ni scroll del lector. */
  function isPanelView() {
    return isFichaView() || isAventurasView();
  }

  function setActiveToc(id) {
    for (const a of tocEl.querySelectorAll("a")) {
      a.classList.toggle("is-active", a.dataset.id === id);
    }
    tocEl.querySelector(`a[data-id="${id}"]`)?.scrollIntoView({ block: "nearest" });
  }

  function setSearchEnabled(on) {
    q.disabled = !on;
    q.closest(".search-box")?.classList.toggle("is-disabled", !on);
    if (!on) {
      q.value = "";
      clearMarks();
      meta.hidden = true;
      prevBtn.hidden = true;
      nextBtn.hidden = true;
    }
  }

  function showFichaView() {
    manualScrollTop = reader.scrollTop;
    if (headingObserver) headingObserver.disconnect();
    if (aventurasObserver) aventurasObserver.disconnect();
    document.body.classList.remove("view-manual", "view-aventuras");
    document.body.classList.add("view-ficha");
    // El índice arranca oculto en la ficha; la hamburguesa lo abre como drawer
    document.body.classList.remove("toc-open");
    scrim.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    reader.hidden = true;
    if (aventurasPanel) aventurasPanel.hidden = true;
    fichaPanel.hidden = false;
    setSearchEnabled(false);
    setActiveToc(FICHA_ID);
    history.replaceState(null, "", `#${FICHA_ID}`);
    syncFichaViewport();
    window.dispatchEvent(new Event("pbta-ficha-show"));
    fichaPanel.focus({ preventScroll: true });
  }

  function showAventurasView(id) {
    manualScrollTop = reader.scrollTop;
    if (headingObserver) headingObserver.disconnect();
    document.body.classList.remove("view-manual", "view-ficha");
    document.body.classList.add("view-aventuras");
    document.body.classList.remove("toc-open");
    scrim.hidden = true;
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    toggle.setAttribute("aria-expanded", mobile ? "false" : "true");
    reader.hidden = true;
    fichaPanel.hidden = true;
    if (aventurasPanel) aventurasPanel.hidden = false;
    // La búsqueda queda activa sobre el libro de aventuras; reset limpio al cruzar vista
    setSearchEnabled(false);
    setSearchEnabled(true);
    // Hijo del sidebar (ancla av-*) → scroll al heading; ítem raíz → arriba del libro
    const anchor = id && id.startsWith("av-") ? document.getElementById(id) : null;
    if (aventurasPanel) {
      if (anchor) anchor.scrollIntoView({ block: "start" });
      else aventurasPanel.scrollTop = 0;
    }
    setActiveToc(id || AVENTURAS_ID);
    history.replaceState(null, "", `#${id || AVENTURAS_ID}`);
    observeAventurasHeadings();
    if (aventurasPanel) aventurasPanel.focus({ preventScroll: true });
  }

  function showManualView(id) {
    const fromAventuras = isAventurasView();
    if (aventurasObserver) aventurasObserver.disconnect();
    document.body.classList.remove("view-ficha", "view-aventuras");
    document.body.classList.add("view-manual");
    // Cerrar el drawer del índice al volver al manual
    document.body.classList.remove("toc-open");
    scrim.hidden = true;
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    toggle.setAttribute("aria-expanded", mobile ? "false" : "true");
    fichaPanel.hidden = true;
    if (aventurasPanel) aventurasPanel.hidden = true;
    reader.hidden = false;
    if (fromAventuras) setSearchEnabled(false); // cruza vista: limpia término/marcas de aventuras
    setSearchEnabled(true);
    observeHeadings();
    const targetId = document.getElementById(id) ? id : "portada";
    history.replaceState(null, "", `#${targetId}`);
    setActiveToc(targetId);
    const el = document.getElementById(targetId);
    if (el) {
      // El smooth scroll se descarrila con lazy imgs: el destino se calcula
      // con el layout aún sin imágenes y queda miles de px corrido.
      // 1) Forzar las lazy previas al destino (estabilizan el layout).
      // 2) Re-sincronizaciones instantáneas como red de seguridad,
      //    canceladas con la primera interacción del usuario.
      book.querySelectorAll("img[loading='lazy']").forEach((im) => {
        if (im.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) {
          im.loading = "eager";
        }
      });
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      const reSync = () => el.scrollIntoView({ block: "start" });
      const timers = [400, 1000, 1800, 2600, 3500].map((t) => setTimeout(reSync, t));
      const cancelSync = () => timers.forEach(clearTimeout);
      reader.addEventListener("wheel", cancelSync, { once: true, passive: true });
      reader.addEventListener("touchstart", cancelSync, { once: true, passive: true });
    } else {
      reader.scrollTop = manualScrollTop;
    }
    requestAnimationFrame(clampReaderScroll);
  }

  function goToId(id) {
    if (!id) return;
    if (id === FICHA_ID) {
      showFichaView();
      return;
    }
    const isAventura =
      id === AVENTURAS_ID || id.startsWith(AVENTURA_PREFIX) || id.startsWith("av-");
    if (isFichaView()) {
      const player = window.PBTA_PLAYER;
      if (player?.isLoggedIn?.() && window.PBTA_FICHA?.isDirty?.()) {
        player
          .gateDirty({ onDiscard: () => player.restoreActiveOrReset?.() })
          .then((ok) => {
            if (!ok) return;
            if (isAventura) showAventurasView(id);
            else showManualView(id);
          });
        return;
      }
    }
    if (isAventura) showAventurasView(id);
    else showManualView(id);
  }

  /** Libro visible: manual o aventuras (la búsqueda opera sobre el activo). */
  function activeBook() {
    return isAventurasView() && aventurasBook ? aventurasBook : book;
  }

  function clampAventurasScroll() {
    if (!aventurasPanel) return;
    const max = Math.max(0, aventurasPanel.scrollHeight - aventurasPanel.clientHeight);
    if (aventurasPanel.scrollTop > max) aventurasPanel.scrollTop = max;
    if (aventurasPanel.scrollTop < 0) aventurasPanel.scrollTop = 0;
  }

  function clampReaderScroll() {
    const max = Math.max(0, reader.scrollHeight - reader.clientHeight);
    if (reader.scrollTop > max) reader.scrollTop = max;
    if (reader.scrollTop < 0) reader.scrollTop = 0;
  }

  function clampSidebarScroll() {
    const max = Math.max(0, sidebar.scrollHeight - sidebar.clientHeight);
    if (sidebar.scrollTop > max) sidebar.scrollTop = max;
    if (sidebar.scrollTop < 0) sidebar.scrollTop = 0;
  }

  function blockWheelPastEdge(el, clamp) {
    el.addEventListener(
      "wheel",
      (ev) => {
        const nested = ev.target.closest(
          "textarea, .table-wrap, .ficha-inv-menu, .ficha-stat-menu, .ficha-prof-menu"
        );
        if (nested instanceof HTMLElement && nested.scrollHeight > nested.clientHeight + 1) {
          const atTop = nested.scrollTop <= 0;
          const atBottom = nested.scrollTop + nested.clientHeight >= nested.scrollHeight - 1;
          if ((ev.deltaY < 0 && !atTop) || (ev.deltaY > 0 && !atBottom)) return;
        }
        clamp();
        const max = Math.max(0, el.scrollHeight - el.clientHeight);
        const atTop = el.scrollTop <= 0;
        const atBottom = el.scrollTop >= max - 1;
        if ((ev.deltaY < 0 && atTop) || (ev.deltaY > 0 && atBottom)) {
          ev.preventDefault();
        }
      },
      { passive: false }
    );
  }

  function syncReaderViewport() {
    reader.style.setProperty("--reader-vh", `${reader.clientHeight}px`);
    reader.style.setProperty("--reader-vw", `${reader.clientWidth}px`);
    clampReaderScroll();
  }

  function syncFichaViewport() {
    if (!fichaPanel || fichaPanel.hidden) return;
    fichaPanel.style.setProperty("--ficha-vh", `${fichaPanel.clientHeight}px`);
    fichaPanel.style.setProperty("--ficha-vw", `${fichaPanel.clientWidth}px`);
  }

  function bindReaderScroll() {
    reader.addEventListener("scroll", clampReaderScroll, { passive: true });
    sidebar.addEventListener("scroll", clampSidebarScroll, { passive: true });
    blockWheelPastEdge(reader, clampReaderScroll);
    blockWheelPastEdge(sidebar, clampSidebarScroll);
    if (aventurasPanel) {
      aventurasPanel.addEventListener("scroll", clampAventurasScroll, { passive: true });
      blockWheelPastEdge(aventurasPanel, clampAventurasScroll);
    }
    blockWheelPastEdge(fichaPanel, () => {
      const max = Math.max(0, fichaPanel.scrollHeight - fichaPanel.clientHeight);
      if (fichaPanel.scrollTop > max) fichaPanel.scrollTop = max;
      if (fichaPanel.scrollTop < 0) fichaPanel.scrollTop = 0;
    });
    window.addEventListener("resize", () => {
      syncReaderViewport();
      syncFichaViewport();
      clampSidebarScroll();
    });
    if ("ResizeObserver" in window) {
      new ResizeObserver(() => {
        syncReaderViewport();
        syncFichaViewport();
      }).observe(reader);
      new ResizeObserver(syncFichaViewport).observe(fichaPanel);
    }
  }

  function openFromHash() {
    const id = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!id) {
      observeHeadings();
      return;
    }
    requestAnimationFrame(() => goToId(id));
  }

  function observeHeadings() {
    if (headingObserver) headingObserver.disconnect();
    if (isPanelView()) return;
    const heads = [...book.querySelectorAll("h1, h2, h3")];
    const cover = document.getElementById("portada");
    if (cover) heads.unshift(cover);
    if (!heads.length || !("IntersectionObserver" in window)) return;
    const map = new Map([...tocEl.querySelectorAll("a")].map((a) => [a.dataset.id, a]));
    let current = null;
    headingObserver = new IntersectionObserver(
      (entries) => {
        if (isPanelView()) return;
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = vis[0]?.target?.id || current;
        if (!id || id === current || id === FICHA_ID) return;
        current = id;
        for (const a of map.values()) a.classList.toggle("is-active", a.dataset.id === id);
        map.get(id)?.scrollIntoView({ block: "nearest" });
      },
      { root: reader, rootMargin: "0px 0px -72% 0px", threshold: [0, 1] }
    );
    heads.forEach((h) => headingObserver.observe(h));
  }

  function bindChrome() {
    const mq = window.matchMedia("(max-width: 760px)");
    const sync = () => {
      const mobile = mq.matches;
      toggle.setAttribute("aria-expanded", mobile ? "false" : "true");
      if (!mobile) {
        document.body.classList.remove("toc-open");
        scrim.hidden = true;
      }
    };
    mq.addEventListener("change", sync);
    sync();

    toggle.addEventListener("click", () => {
      const inFicha = document.body.classList.contains("view-ficha");
      if (!mq.matches && !inFicha) return;
      const open = !document.body.classList.contains("toc-open");
      document.body.classList.toggle("toc-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      scrim.hidden = !open;
    });
    scrim.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") closeDrawer();
    });
  }

  function closeDrawer() {
    document.body.classList.remove("toc-open");
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    const inFicha = document.body.classList.contains("view-ficha");
    toggle.setAttribute("aria-expanded", mobile || inFicha ? "false" : "true");
    scrim.hidden = true;
  }

  function bindSearch() {
    let hits = [];
    let idx = -1;
    let raw = "";

    const run = () => {
      if (isFichaView()) return;
      const term = q.value.trim();
      if (term === raw) return;
      raw = term;
      clearMarks();
      hits = [];
      idx = -1;
      if (term.length < 2) {
        meta.hidden = true;
        prevBtn.hidden = true;
        nextBtn.hidden = true;
        return;
      }
      hits = highlight(activeBook(), term);
      meta.hidden = false;
      prevBtn.hidden = false;
      nextBtn.hidden = false;
      if (hits.length) {
        idx = 0;
        focusHit();
      } else {
        meta.textContent = "0/0";
      }
    };

    q.addEventListener("input", run);
    q.addEventListener("keydown", (ev) => {
      if (isFichaView()) return;
      if (ev.key === "Enter") {
        ev.preventDefault();
        if (ev.shiftKey) step(-1);
        else step(1);
      }
    });
    prevBtn.addEventListener("click", () => step(-1));
    nextBtn.addEventListener("click", () => step(1));

    function step(dir) {
      if (!hits.length || isFichaView()) return;
      idx = (idx + dir + hits.length) % hits.length;
      focusHit();
    }

    function focusHit() {
      hits.forEach((m, i) => m.classList.toggle("is-current", i === idx));
      meta.textContent = `${idx + 1}/${hits.length}`;
      hits[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function clearMarks() {
    for (const root of [book, aventurasBook]) {
      if (!root) continue;
      for (const mark of [...root.querySelectorAll("mark")]) {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    }
  }

  function highlight(root, term) {
    const needle = term.toLowerCase();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentElement?.closest("mark")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    const marks = [];
    for (const node of nodes) {
      const text = node.nodeValue;
      const lower = text.toLowerCase();
      if (!lower.includes(needle)) continue;
      const frag = document.createDocumentFragment();
      let start = 0;
      let pos = lower.indexOf(needle, start);
      while (pos !== -1) {
        if (pos > start) frag.appendChild(document.createTextNode(text.slice(start, pos)));
        const mark = document.createElement("mark");
        mark.textContent = text.slice(pos, pos + term.length);
        frag.appendChild(mark);
        marks.push(mark);
        start = pos + term.length;
        pos = lower.indexOf(needle, start);
      }
      if (start < text.length) frag.appendChild(document.createTextNode(text.slice(start)));
      node.parentNode.replaceChild(frag, node);
    }
    return marks;
  }
})();
