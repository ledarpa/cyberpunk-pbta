(() => {
  const data = window.PBTA_MANUAL;
  const book = document.getElementById("book");
  const tocEl = document.getElementById("toc");
  const reader = document.getElementById("reader");
  const q = document.getElementById("q");
  const meta = document.getElementById("search-meta");
  const prevBtn = document.getElementById("search-prev");
  const nextBtn = document.getElementById("search-next");
  const toggle = document.getElementById("toc-toggle");
  const scrim = document.getElementById("scrim");
  const sidebar = document.getElementById("sidebar");

  if (!data || !book) {
    document.body.innerHTML = "<p style='padding:2rem'>Falta data/manual.js. Ejecutá docs/scripts/build_web_reader.py</p>";
    return;
  }

  book.innerHTML = data.html;
  loadCover();
  renderToc(data.toc || []);
  observeHeadings();
  bindNav();
  bindSearch();
  bindChrome();
  openFromHash();

  function loadCover() {
    const pre = document.getElementById("cover-art");
    if (!pre) return;
    fetch("data/portada-ascii.txt")
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((t) => {
        pre.textContent = t
          .replace(/\n+$/, "")
          .split("\n")
          .map((line) => line.replace(/[ \u00a0]+$/g, ""))
          .join("\n");
        fitCoverArt();
        requestAnimationFrame(fitCoverArt);
      })
      .catch(() => {
        pre.textContent = "pbta:\\>";
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

    pre.style.transform = "none";
    pre.style.fontSize = "40px";

    const boxW = frame.clientWidth;
    const boxH = Math.max(24, page.clientHeight * 0.16);
    const artW = pre.scrollWidth;
    const artH = pre.scrollHeight;
    if (!artW || !artH || !boxW) return;

    const px = 40 * Math.min(boxW / artW, boxH / artH, 1);
    pre.style.fontSize = `${Math.max(5, px)}px`;
  }

  function renderToc(toc) {
    const frag = document.createDocumentFragment();
    const coverLink = document.createElement("a");
    coverLink.href = "#portada";
    coverLink.className = "l1";
    coverLink.textContent = "Portada";
    coverLink.dataset.id = "portada";
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
    tocEl.replaceChildren(frag);
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

  function goToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
  }

  function openFromHash() {
    const id = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!id) return;
    requestAnimationFrame(() => goToId(id));
  }

  function observeHeadings() {
    const heads = [...book.querySelectorAll("h1, h2, h3")];
    const cover = document.getElementById("portada");
    if (cover) heads.unshift(cover);
    if (!heads.length || !("IntersectionObserver" in window)) return;
    const map = new Map([...tocEl.querySelectorAll("a")].map((a) => [a.dataset.id, a]));
    let current = null;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = vis[0]?.target?.id || current;
        if (!id || id === current) return;
        current = id;
        for (const a of map.values()) a.classList.toggle("is-active", a.dataset.id === id);
        map.get(id)?.scrollIntoView({ block: "nearest" });
      },
      { root: reader, rootMargin: "0px 0px -72% 0px", threshold: [0, 1] }
    );
    heads.forEach((h) => io.observe(h));
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
      if (ev.key === "Enter") {
        ev.preventDefault();
        if (ev.shiftKey) step(-1);
        else step(1);
      }
    });
    prevBtn.addEventListener("click", () => step(-1));
    nextBtn.addEventListener("click", () => step(1));

    function step(dir) {
      if (!hits.length) return;
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
