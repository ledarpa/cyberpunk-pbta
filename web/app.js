(() => {
  const data = window.PBTA_MANUAL;
  const book = document.getElementById("book");
  const tocEl = document.getElementById("toc");
  const reader = document.getElementById("reader");
  const fichaPanel = document.getElementById("ficha-panel");
  const q = document.getElementById("q");
  const meta = document.getElementById("search-meta");
  const prevBtn = document.getElementById("search-prev");
  const nextBtn = document.getElementById("search-next");
  const toggle = document.getElementById("toc-toggle");
  const scrim = document.getElementById("scrim");
  const sidebar = document.getElementById("sidebar");

  const FICHA_ID = "hoja-personaje";
  let manualScrollTop = 0;
  let headingObserver = null;

  if (!data || !book) {
    document.body.innerHTML = "<p style='padding:2rem'>Falta data/manual.js. Ejecutá docs/scripts/build_web_reader.py</p>";
    return;
  }

  book.innerHTML = data.html;
  loadCover();
  renderToc(data.toc || []);
  bindNav();
  bindSearch();
  bindChrome();
  bindReaderScroll();
  syncReaderViewport();
  syncFichaViewport();
  openFromHash();
  window.addEventListener("hashchange", openFromHash);
  layoutBookArtWraps();
  requestAnimationFrame(() => {
    layoutBookArtWraps();
    requestAnimationFrame(layoutBookArtWraps);
  });
  let artLayoutTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(artLayoutTimer);
    artLayoutTimer = setTimeout(layoutBookArtWraps, 60);
  });

  /** Alinea arte del wrap con el margen inferior de la tabla Calidad; texto full-width arriba. */
  function layoutBookArtWraps() {
    const wraps = book.querySelectorAll(".book-art-wrap");
    if (!wraps.length) return;

    const mobile = window.matchMedia("(max-width: 720px)").matches;

    wraps.forEach((wrap) => {
      const art = wrap.querySelector(":scope > .book-item-art, :scope > .book-item-art-row");
      const copy = wrap.querySelector(":scope > .book-art-wrap-copy");
      const table = copy && copy.querySelector(":scope > .table-wrap--rail");
      const anchorCopy = art?.dataset?.artAnchor === "copy";
      if (!art || !copy) return;
      if (!table && !anchorCopy) return;

      art.querySelectorAll("img").forEach((img) => {
        if (img.dataset.artLayoutBound) return;
        img.dataset.artLayoutBound = "1";
        img.addEventListener("load", layoutBookArtWraps);
      });

      if (mobile || wrap.clientWidth < 580) {
        wrap.style.removeProperty("--art-shift");
        wrap.style.removeProperty("--art-h");
        const img = art.querySelector("img");
        if (img) img.style.removeProperty("max-height");
        return;
      }

      const prevDisplay = art.style.display;
      wrap.style.setProperty("--art-shift", "0px");
      wrap.style.removeProperty("--art-h");

      const isBrazo = !!art.querySelector(".book-item-art--sable_mantis");
      const isPortraitTop = art.dataset.artLayout === "portrait-top";
      const isPortraitSpan = art.dataset.artLayout === "portrait-span";
      const isCerebral = art.dataset.artSize === "cerebral";

      if (isPortraitSpan && anchorCopy) {
        // Degeneración / Recuperar: alineación por CSS (bottom o top absolutos).
        wrap.style.removeProperty("--art-shift");
        wrap.style.removeProperty("--art-h");
        const img = art.querySelector("img");
        if (img) img.style.removeProperty("max-height");
        return;
      }

      // Medir texto+tabla a ancho completo (sin float)
      art.style.display = "none";
      const wrapTop0 = wrap.getBoundingClientRect().top;
      const tableBottom0 = table.getBoundingClientRect().bottom - wrapTop0;
      const tableH = table.offsetHeight;
      const contentH = copy.offsetHeight;
      art.style.display = prevDisplay;
      if (!contentH || !tableH) return;

      const naturalH = art.offsetHeight;
      if (!naturalH) return;

      if (isPortraitSpan) {
        const railTable = copy.querySelector(":scope > .table-wrap--rail");
        if (!railTable) return;

        wrap.style.setProperty("--art-h", "auto");
        wrap.style.removeProperty("--art-shift");

        const img = art.querySelector("img");
        if (!img) return;

        const bottomDelta = () =>
          Math.round(
            railTable.getBoundingClientRect().bottom -
              (img || art).getBoundingClientRect().bottom
          );

        let shift = Math.max(
          0,
          Math.round(
            railTable.getBoundingClientRect().bottom -
              wrap.getBoundingClientRect().top -
              img.getBoundingClientRect().height
          )
        );
        wrap.style.setProperty("--art-shift", `${shift}px`);

        for (let i = 0; i < 6; i++) {
          const fix = bottomDelta();
          if (fix === 0) break;
          shift = Math.max(0, shift + fix);
          wrap.style.setProperty("--art-shift", `${shift}px`);
        }
        return;
      }
      if (isBrazo || isPortraitTop) {
        wrap.style.setProperty("--art-shift", "0px");
        art.style.display = prevDisplay;

        const img = art.querySelector("img");
        const imgBottomDelta = () =>
          Math.round(
            table.getBoundingClientRect().bottom -
              (img || art).getBoundingClientRect().bottom
          );

        const isTool = art.dataset.artSize === "tool";
        const alignBottomToTable = isCerebral || isTool;

        if (alignBottomToTable && img) {
          wrap.style.setProperty("--art-h", "auto");
          wrap.style.removeProperty("--art-shift");
          let shift = Math.max(
            0,
            Math.round(
              table.getBoundingClientRect().bottom -
                wrap.getBoundingClientRect().top -
                img.getBoundingClientRect().height
            )
          );
          wrap.style.setProperty("--art-shift", `${shift}px`);
          for (let i = 0; i < 4; i++) {
            const fix = imgBottomDelta();
            if (fix === 0) break;
            shift = Math.max(0, shift + fix);
            wrap.style.setProperty("--art-shift", `${shift}px`);
          }
        } else {
          let artH = Math.round(tableBottom0);
          if (isPortraitTop && img?.naturalWidth && img.naturalHeight && art.offsetWidth) {
            artH = Math.max(
              artH,
              Math.round((art.offsetWidth / img.naturalWidth) * img.naturalHeight)
            );
          }
          wrap.style.setProperty("--art-h", `${artH}px`);

          const fix = Math.round(
            table.getBoundingClientRect().bottom -
              wrap.getBoundingClientRect().top -
              (art.getBoundingClientRect().bottom - wrap.getBoundingClientRect().top)
          );
          if (fix !== 0) {
            artH = Math.max(tableH, artH + fix);
            wrap.style.setProperty("--art-h", `${artH}px`);
          }
        }
        return;
      }

      // Ojo y similares: arte anclado al margen inferior de la tabla
      let artH = naturalH;
      if (naturalH > contentH) {
        wrap.style.setProperty("--art-h", `${Math.round(tableH)}px`);
        artH = art.offsetHeight || tableH;
      }

      // Anclar margen inferior del arte al de la tabla
      const shift = Math.max(0, Math.round(tableBottom0 - artH));
      wrap.style.setProperty("--art-shift", `${shift}px`);

      // Ajuste fino tras reflow del float
      const wrapTop = wrap.getBoundingClientRect().top;
      const delta = Math.round(
        table.getBoundingClientRect().bottom -
          wrapTop -
          (art.getBoundingClientRect().bottom - wrapTop)
      );
      if (delta) {
        wrap.style.setProperty("--art-shift", `${Math.max(0, shift + delta)}px`);
      }
    });
  }

  function normalizeAscii(text) {
    return (window.PBTA_LOGO ? window.PBTA_LOGO.normalize(text) : text.replace(/\u00a0/g, " ")).replace(/\n+$/, "");
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

  function fetchCoverAscii() {
    if (fetchCoverAscii.cache) return Promise.resolve(fetchCoverAscii.cache);
    return fetch("data/portada-ascii.txt")
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((t) => {
        fetchCoverAscii.cache = normalizeAscii(t);
        return fetchCoverAscii.cache;
      });
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
    fichaLink.textContent = "Hoja de personaje";
    fichaLink.dataset.id = FICHA_ID;
    frag.appendChild(fichaLink);
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
    document.body.classList.remove("view-manual");
    document.body.classList.add("view-ficha");
    reader.hidden = true;
    fichaPanel.hidden = false;
    setSearchEnabled(false);
    setActiveToc(FICHA_ID);
    history.replaceState(null, "", `#${FICHA_ID}`);
    syncFichaViewport();
    window.dispatchEvent(new Event("pbta-ficha-show"));
    fichaPanel.focus({ preventScroll: true });
  }

  function showManualView(id) {
    document.body.classList.remove("view-ficha");
    document.body.classList.add("view-manual");
    fichaPanel.hidden = true;
    reader.hidden = false;
    setSearchEnabled(true);
    observeHeadings();
    const targetId = document.getElementById(id) ? id : "portada";
    history.replaceState(null, "", `#${targetId}`);
    setActiveToc(targetId);
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
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
    if (isFichaView()) {
      const player = window.PBTA_PLAYER;
      if (player?.isLoggedIn?.() && window.PBTA_FICHA?.isDirty?.()) {
        player
          .gateDirty({ onDiscard: () => player.restoreActiveOrReset?.() })
          .then((ok) => {
            if (ok) showManualView(id);
          });
        return;
      }
    }
    showManualView(id);
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
    if (isFichaView()) return;
    const heads = [...book.querySelectorAll("h1, h2, h3")];
    const cover = document.getElementById("portada");
    if (cover) heads.unshift(cover);
    if (!heads.length || !("IntersectionObserver" in window)) return;
    const map = new Map([...tocEl.querySelectorAll("a")].map((a) => [a.dataset.id, a]));
    let current = null;
    headingObserver = new IntersectionObserver(
      (entries) => {
        if (isFichaView()) return;
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
      if (!mq.matches) return;
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
    toggle.setAttribute("aria-expanded", window.matchMedia("(max-width: 760px)").matches ? "false" : "true");
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
      hits = highlight(book, term);
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
    for (const mark of [...book.querySelectorAll("mark")]) {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
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
