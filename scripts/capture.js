/* Harness de capturas para la pasada visual del manual.
 * Sirve web/ estático y captura cada capítulo (elemento <article class="chapter">)
 * + portada + ficha en varios viewports. Salida: shots/<WxH>/<nombre>.png
 *
 * Uso: node scripts/capture.js [--viewports 390x844,1920x1080] [--targets sistema,ficha]
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const WEB = path.join(ROOT, "web");
const OUT = path.join(ROOT, "shots");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

const DEFAULT_VIEWPORTS = [
  [390, 844], // celular portrait
  [844, 390], // celular landscape
  [768, 1024], // tablet portrait
  [1366, 768], // laptop
  [1920, 1080], // desktop
];

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (name) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : null;
  };
  const vp = get("viewports");
  const tg = get("targets");
  return {
    viewports: vp
      ? vp.split(",").map((s) => s.trim().split("x").map(Number))
      : DEFAULT_VIEWPORTS,
    targets: tg ? tg.split(",").map((s) => s.trim()) : null,
  };
}

function serve() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
    let file = path.normalize(path.join(WEB, urlPath === "/" ? "index.html" : urlPath));
    if (!file.startsWith(WEB)) {
      res.writeHead(403);
      return res.end();
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(WEB, "index.html");
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

function chapterFiles() {
  const raw = fs.readFileSync(path.join(WEB, "data", "manual.js"), "utf8");
  return [...raw.matchAll(/data-file=\\"([^\\"]+)\\"/g)].map((m) => m[1]);
}

async function waitReady(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

// Recorre el reader 0→fondo→0 para despertar las imágenes lazy nativas,
// luego las pone en eager por las dudas y espera a que terminen.
async function preloadImages(page) {
  await page.evaluate(async () => {
    const reader = document.getElementById("reader");
    document.getElementById("reader")?.style.setProperty("scroll-behavior", "auto");
    if (reader) {
      const step = Math.max(200, reader.clientHeight - 60);
      for (let y = 0; y <= reader.scrollHeight; y += step) {
        reader.scrollTop = y;
        await new Promise((r) => setTimeout(r, 50));
      }
      reader.scrollTop = 0;
    }
    document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = "eager"));
    const t0 = Date.now();
    while (Date.now() - t0 < 25000) {
      if (![...document.images].some((i) => !i.complete)) break;
      await new Promise((r) => setTimeout(r, 250));
    }
    await new Promise((r) => setTimeout(r, 300));
  });
}

function slug(s) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

// Captura el capítulo por secciones (h1/h2) en rodajas de alto = viewport del reader:
// scroll real del reader + clip sobre la superficie renderizada → fiel a lo que ve el usuario.
async function captureChapter(page, fileName, dir, safe) {
  const sel = `article.chapter[data-file="${fileName}"]`;
  if (!(await page.locator(sel).count())) {
    console.warn(`skip ${safe}: no existe`);
    return 0;
  }
  const OVERLAP = 80;
  // Secciones en coordenadas del contenido scrolleable del reader
  const info = await page.evaluate((sel) => {
    const reader = document.getElementById("reader");
    const el = document.querySelector(sel);
    const rTop = reader.getBoundingClientRect().top;
    const st = reader.scrollTop;
    const abs = (n) => n.getBoundingClientRect().top - rTop + st;
    const heads = [...el.querySelectorAll("h1, h2")].map((h) => ({
      title: h.textContent.trim(),
      top: abs(h),
    }));
    return {
      top: abs(el),
      height: el.offsetHeight,
      clientH: reader.clientHeight,
      heads,
    };
  }, sel);
  const starts = info.heads.length ? info.heads : [{ title: "full", top: info.top }];
  const sections = starts.map((h, i) => ({
    title: h.title,
    top: h.top - 10, // aire sobre el encabezado
    end: i + 1 < starts.length ? starts[i + 1].top : info.top + info.height,
  }));
  const sliceH = info.clientH;
  let made = 0;
  for (const sec of sections) {
    const total = sec.end - sec.top;
    if (total < 40) continue;
    const step = sliceH - OVERLAP;
    const parts = Math.max(1, Math.ceil((total - OVERLAP) / step));
    for (let p = 0; p < parts; p++) {
      const sliceTop = sec.top + p * step;
      const want = Math.min(sliceH, sec.end - sliceTop);
      if (want < 60) break;
      // Scrollear y medir la geometría real ya scrolleada (por si scrollTop clampeó)
      const geo = await page.evaluate(({ sel, sliceTop }) => {
        const reader = document.getElementById("reader");
        reader.scrollTop = sliceTop;
        const a = document.querySelector(sel).getBoundingClientRect();
        const r = reader.getBoundingClientRect();
        return { x: a.left, w: a.width, readerTop: r.top, readerBottom: r.bottom, actualST: reader.scrollTop };
      }, { sel, sliceTop });
      await page.waitForTimeout(120);
      const y = geo.readerTop + (sliceTop - geo.actualST);
      const h = Math.min(want, geo.readerBottom - y);
      if (h < 60) continue;
      const name = `${safe}__${parts > 1 ? `p${p + 1}-` : ""}${slug(sec.title)}.png`;
      await page.screenshot({
        path: path.join(dir, name),
        clip: { x: Math.max(0, geo.x), y, width: geo.w, height: h },
      });
      console.log(`OK ${name}`);
      made++;
    }
  }
  return made;
}

(async () => {
  const { viewports, targets } = parseArgs();
  const { server, port } = await serve();
  const base = `http://127.0.0.1:${port}/`;
  const chapters = chapterFiles();
  const jobs = ["portada", ...chapters.map((f) => `cap:${f}`), "ficha"].filter(
    (t) => !targets || targets.some((x) => t.includes(x))
  );

  const browser = await chromium.launch();
  try {
    for (const [w, h] of viewports) {
      const dir = path.join(OUT, `${w}x${h}`);
      fs.mkdirSync(dir, { recursive: true });
      const page = await browser.newPage({ viewport: { width: w, height: h } });
      try {
        await page.goto(base, { waitUntil: "domcontentloaded" });
        await waitReady(page);
        // 1) Portada y ficha: viewport, antes de expandir el reader
        for (const job of jobs.filter((j) => j === "portada" || j === "ficha")) {
          const file = path.join(dir, `${job}.png`);
          if (job === "portada") {
            await page.goto(`${base}#portada`);
            await page.waitForTimeout(500);
            await page.screenshot({ path: file });
          } else {
            await page.goto(`${base}#hoja-personaje`);
            try {
              await page.waitForSelector("#ficha-panel:not([hidden])", { timeout: 8000 });
            } catch {
              console.warn(`skip ficha @${w}x${h}: panel no visible`);
              continue;
            }
            await page.waitForTimeout(900);
            await page.screenshot({ path: file });
          }
          console.log(`OK ${w}x${h}/${job}.png`);
        }
        // 2) Capítulos: precargar imágenes y cortar por secciones legibles
        const chapterJobs = jobs.filter((j) => j.startsWith("cap:"));
        if (chapterJobs.length) {
          await page.goto(base, { waitUntil: "domcontentloaded" });
          await waitReady(page);
          await preloadImages(page);
          for (const job of chapterJobs) {
            const safe = job.slice(4).replace(/\.md$/, "");
            await captureChapter(page, job.slice(4), dir, safe).catch((e) => {
              console.warn(`fail ${w}x${h}/${safe}: ${String(e).slice(0, 200)}`);
            });
          }
        }
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
