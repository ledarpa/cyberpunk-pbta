/* Smoke funcional post-refactor: estados interactivos que la pasada visual no cubre.
 * Sirve web/ estático y valida: menú inventario, picker de stats, búsqueda,
 * switch ES/EN, sin errores de consola. Salida: OK/FAIL por chequeo.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const WEB = process.env.WEB_DIR || path.join(__dirname, "..", "web");
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".png": "image/png", ".webp": "image/webp",
  ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".txt": "text/plain", ".json": "application/json",
};

function serve() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
    let file = path.normalize(path.join(WEB, urlPath === "/" ? "index.html" : urlPath));
    if (!file.startsWith(WEB)) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(WEB, "index.html");
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port })));
}

(async () => {
  const { server, port } = await serve();
  const base = `http://127.0.0.1:${port}/`;
  const browser = await chromium.launch();
  // locale ES: sin esto, Chromium headless reporta en-US y la app
  // autodetecta inglés en el boot (title EN + diccionario EN).
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, locale: "es-ES" });
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message));

  const results = [];
  const check = (name, ok) => { results.push(`${ok ? "OK  " : "FAIL"} ${name}`); };

  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.evaluate(async () => { await document.fonts.ready; });

  // 1) Búsqueda: marks + meta contador
  await page.fill("#q", "cromo");
  await page.waitForTimeout(700);
  check("búsqueda produce hits + contador", await page.locator("#search-meta:visible").count() > 0 && await page.locator("mark").count() > 0);
  await page.fill("#q", "");
  await page.waitForTimeout(300);

  // 2) Switch de idioma: título de documento cambia y vuelve
  const t0 = await page.title();
  await page.click('.lang-btn[data-lang="en"]');
  await page.waitForTimeout(1000);
  const tEN = await page.title();
  check("switch EN cambia el título", t0 !== tEN);
  await page.click('.lang-btn[data-lang="es"]');
  await page.waitForTimeout(1000);
  check("vuelta a ES restaura el título", (await page.title()) === t0);

  // 3) Ficha: panel visible + picker de stat abre menú
  await page.goto(base + "#hoja-personaje", { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#ficha-panel:not([hidden])", { timeout: 8000 });
  check("ficha visible", true);
  await page.waitForTimeout(800);

  // picker de profesión (menú propio de ficha.js)
  const profTrigger = page.locator(".ficha-prof-trigger").first();
  if (await profTrigger.count()) {
    await profTrigger.click();
    await page.waitForTimeout(300);
    check("menú de profesión abre", await page.locator(".ficha-prof-menu:not([hidden])").count() > 0);
    await page.keyboard.press("Escape");
    await page.mouse.click(10, 300);
    await page.waitForTimeout(200);
  } else {
    check("menú de profesión abre", false);
  }

  // trigger de inventario (menú propio de ficha-inv.js)
  const invTrigger = page.locator(".ficha-inv-trigger").first();
  if (await invTrigger.count()) {
    await invTrigger.click();
    await page.waitForTimeout(400);
    const menuOpen = await page.locator(".ficha-inv-menu:not([hidden])").count() > 0;
    check("menú de inventario abre", menuOpen);
    if (menuOpen) {
      // el menú de catálogo lista items del catalogo.js
      const opts = await page.locator(".ficha-inv-menu:not([hidden]) .ficha-inv-opt, .ficha-inv-menu:not([hidden]) [role=option]").count();
      check("menú de inventario lista opciones", opts > 0);
    }
    await page.keyboard.press("Escape");
    await page.mouse.click(10, 300);
  } else {
    check("menú de inventario abre", false);
  }

  // 4) Salida limpia de consola
  check("sin errores de consola/pageerror", consoleErrors.length === 0);

  console.log(results.join("\n"));
  if (consoleErrors.length) console.log("ERRORES:\n" + consoleErrors.slice(0, 10).join("\n"));
  await browser.close();
  server.close();
  process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
