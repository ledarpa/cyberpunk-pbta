/** Motor de layout del arte del manual (extraído de app.js).
 *  Registro de reglas por slug: agregar arte = agregar entrada, sin tocar el motor.
 *  Comportamiento histórico preservado: orden de pasadas, try/catch del 2d6
 *  y constantes de medición de cada regla.
 */
window.PBTA_ART_LAYOUT = (() => {
  let book = null;

  /** Pasada completa de layout de arte (se repite en rAF: imgs cargan tarde). */
  // layoutBookArtWraps crashea en el wrap del 2d6 (anchor=copy sin tabla rail,
  // ver regla display:block !important del CSS). Aislado en TODOS sus puntos
  // de entrada (boot, resize y el listener img load) — comportamiento
  // histórico: el forEach se corta en el 2d6, los demás wraps no se miden.
  function safeLayoutArtWraps() {
    try {
      layoutBookArtWraps();
    } catch {
      /* el forEach se corta en el 2d6, como siempre */
    }
  }

  /** Bloque wrap { figure + copy(p + tabla rail) }: dibujo a la derecha
      abarcando intro+tabla — top = primera línea, bottom = tabla. */
  function layoutArtToBlock(art, opts = {}) {
    const { minH = 40, containerGuard = true, capW = true, railFromCopy = false } = opts;
    const wrap = art && art.closest(".book-art-wrap");
    const copy = wrap && wrap.querySelector(".book-art-wrap-copy");
    const p = copy && copy.querySelector(":scope > p, :scope > ul");
    const rail = railFromCopy
      ? copy && copy.querySelector(":scope > .table-wrap--rail")
      : wrap && wrap.querySelector(".table-wrap--rail");
    const img = art && art.querySelector("img");
    if (!art || !wrap || !p || !rail || !img) return;

    const clear = () => {
      art.style.removeProperty("height");
      art.style.removeProperty("width");
      img.style.removeProperty("width");
      img.style.removeProperty("height");
    };

    // Apilado o imagen sin cargar: sin medición. Guard doble: la media de
    // los catálogos apila por VIEWPORT (≤760), Mejoras por container
    // (wrap < 576). Con uno solo, en 576-760px el JS medía el layout
    // apilado y estiraba la imagen a miles de px.
    if (innerWidth <= 760 || (containerGuard && wrap.clientWidth < 576) || !img.complete || !img.naturalWidth) {
      clear();
      return;
    }

    const ratio = img.naturalWidth / img.naturalHeight;
    // Cap opcional por sección: --cat-max-w en el wrap (px o % del wrap).
    // Corta la espiral "imagen agranda → columna angosta → tabla crece"
    // en secciones con PNG muy vertical + tabla verbosa.
    const capRaw = capW ? getComputedStyle(wrap).getPropertyValue("--cat-max-w").trim() : "";
    const capM = /^([\d.]+)%$/.exec(capRaw);
    const capWpx = capM
      ? (parseFloat(capM[1]) / 100) * wrap.clientWidth
      : capRaw
        ? parseFloat(capRaw) || Infinity
        : Infinity;
    for (let i = 0; i < 6; i++) {
      const top = p.getBoundingClientRect().top;
      const bottom = rail.getBoundingClientRect().bottom;
      let h = bottom - top;
      if (h < minH) return;
      let w = Math.max(1, Math.round(h * ratio));
      if (w > capWpx) {
        w = Math.round(capWpx);
        h = w / ratio;
      }
      const fr = art.getBoundingClientRect();
      if (Math.abs(fr.height - h) < 0.5 && Math.abs(fr.width - w) < 1) break;
      art.style.height = `${h.toFixed(2)}px`;
      art.style.width = `${w}px`;
      img.style.width = "100%";
      img.style.height = "100%";
    }
  }

  /** Brazo de combate: la row de 2 imágenes compone UNA imagen —
      alto = bloque intro+tabla; ancho de cada fig por su ratio natural. */
  function layoutBrazoRow() {
    const art = book.querySelector(".book-item-art--sable_mantis");
    const row = art && art.closest(".book-item-art-row");
    const wrap = art && art.closest(".book-art-wrap");
    const copy = wrap && wrap.querySelector(".book-art-wrap-copy");
    const p = copy && copy.querySelector(":scope > p, :scope > ul");
    const rail = copy && copy.querySelector(":scope > .table-wrap--rail");
    if (!art || !row || !p || !rail) return;
    const figs = [...row.querySelectorAll(":scope > .book-item-art")];
    const imgs = figs.map((f) => f.querySelector("img"));

    const clear = () => {
      row.style.removeProperty("height");
      row.style.removeProperty("width");
      figs.forEach((f) => {
        f.style.removeProperty("width");
        f.style.removeProperty("height");
      });
      imgs.forEach((im) => {
        im.style.removeProperty("width");
        im.style.removeProperty("height");
      });
    };
    if (innerWidth <= 760 || imgs.some((im) => !im.complete || !im.naturalWidth)) {
      clear();
      return;
    }

    const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
    for (let i = 0; i < 6; i++) {
      const top = p.getBoundingClientRect().top;
      const bottom = rail.getBoundingClientRect().bottom;
      const h = bottom - top;
      if (h < 40) return;
      const ws = imgs.map((im) =>
        Math.max(1, Math.round(h * (im.naturalWidth / im.naturalHeight)))
      );
      const w = ws.reduce((a, b) => a + b, 0) + gap * (imgs.length - 1);
      const fr = row.getBoundingClientRect();
      if (Math.abs(fr.height - h) < 0.5 && Math.abs(fr.width - w) < 1) break;
      row.style.height = `${h.toFixed(2)}px`;
      row.style.width = `${w}px`;
      figs.forEach((f, idx) => {
        f.style.width = `${ws[idx]}px`;
        f.style.height = "100%";
      });
      imgs.forEach((im) => {
        im.style.width = "100%";
        im.style.height = "100%";
      });
    }
  }

  /** Conexión neuronal / Neurochip: imagen espejo de la del sai —
      copia la altura ya medida; el ancho espejo o por ratio propio. */
  function layoutSaiMirror(selector, ownRatio) {
    return () => {
      const art = book.querySelector(selector);
      const sai = book.querySelector(".book-item-art--sai");
      const img = art && art.querySelector("img");
      if (!art || !img) return;

      const clear = () => {
        art.style.removeProperty("height");
        art.style.removeProperty("width");
        img.style.removeProperty("width");
        img.style.removeProperty("height");
      };
      if (innerWidth <= 760 || !img.complete || !img.naturalWidth || !sai || !sai.style.height) {
        clear();
        return;
      }

      const fr = sai.getBoundingClientRect();
      if (ownRatio) {
        // Neurochip (557×850): mismo alto que el sai; ancho por su ratio propio.
        const w = Math.max(1, Math.round(fr.height * (img.naturalWidth / img.naturalHeight)));
        art.style.height = `${fr.height.toFixed(2)}px`;
        art.style.width = `${w}px`;
      } else {
        art.style.height = `${fr.height.toFixed(2)}px`;
        art.style.width = `${fr.width.toFixed(2)}px`;
      }
      img.style.width = "100%";
      img.style.height = "100%";
    };
  }

  /** Alinea arte del wrap con el margen inferior de la tabla Calidad; texto full-width arriba. */
  function layoutBookArtWraps() {
    const wraps = book.querySelectorAll(".book-art-wrap");
    if (!wraps.length) return;

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
        img.addEventListener("load", safeLayoutArtWraps);
      });

      if (wrap.clientWidth < 320) {
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
        const isSintetica = art.dataset.artSize === "sintetica";
        const alignBottomToTable = isCerebral || isTool || isSintetica;

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

      // Ojo / oído biónico: tamaño natural; margen inferior alineado a la tabla
      const isSensoryArt =
        art.classList.contains("book-item-art--ojo") ||
        art.classList.contains("book-item-art--cyberoido");

      if (isSensoryArt) {
        wrap.style.setProperty("--art-h", "auto");
        wrap.style.removeProperty("--art-shift");
        const img = art.querySelector("img");
        if (!img) return;

        const imgBottomDelta = () =>
          Math.round(
            table.getBoundingClientRect().bottom -
              (img || art).getBoundingClientRect().bottom
          );

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

  // ── Registro de reglas (orden de pasada = orden de la lista) ─────────
  const blockRule = (sel, opts) => ({
    layout: () => layoutArtToBlock(book.querySelector(sel), opts),
    bindSel: `${sel} img`,
  });

  const RULES = [
    blockRule(".book-item-art--mejora_de_atributos"),
    blockRule(".book-item-art--drone"),
    blockRule(".book-item-art--primeros_auxilios"),
    blockRule(".book-item-art--trauma_card"),
    {
      layout: layoutBrazoRow,
      bindSel: ".book-art-wrap:has(.book-item-art--sable_mantis) .book-item-art-row img",
    },
    {
      ...blockRule(".book-item-art--sai", { minH: 60, containerGuard: false, capW: false, railFromCopy: true }),
      load: "trio",
    },
    {
      layout: layoutSaiMirror(".book-item-art--conexion_neuronal", false),
      bindSel: ".book-item-art--conexion_neuronal img",
      load: "trio",
    },
    {
      layout: layoutSaiMirror(".book-item-art--neurochip", true),
      bindSel: ".book-item-art--neurochip img",
      load: "trio",
    },
  ];

  const runTrio = () => {
    for (const rule of RULES) if (rule.load === "trio") rule.layout();
  };

  /** Pasada completa sobre el manual activo. */
  function run(root) {
    book = root;
    safeLayoutArtWraps();
    for (const rule of RULES) rule.layout();
  }

  /** Listeners de load por dibujo: se re-ligan en cada render (DOM nuevo). */
  function bind(root) {
    book = root;
    for (const rule of RULES) {
      const imgs = root.querySelectorAll(rule.bindSel);
      if (rule.load === "trio") {
        for (const im of imgs) im.addEventListener("load", runTrio);
      } else {
        for (const im of imgs) im.addEventListener("load", rule.layout);
      }
    }
  }

  return { run, bind };
})();
