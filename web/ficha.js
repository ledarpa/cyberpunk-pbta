/** Hoja de personaje digital — 3 columnas, réplica DOS (verde sobre negro). */
(() => {
  const STORAGE_KEY = "pbta-ficha-v1";
  const LEDGER_ROWS = 30;
  const SALUD_ROWS = [
    { label: "Normal", boxes: 5, ghostFirst: false },
    { label: "-1", boxes: 4, ghostFirst: true },
    { label: "-2", boxes: 4, ghostFirst: true },
    { label: "-3", boxes: 4, ghostFirst: true },
    { label: "Falla Integral", boxes: 2, ghostFirst: true, falla: true },
  ];

  const form = document.getElementById("ficha-form");
  if (!form) return;

  form.innerHTML = buildSheetHtml();
  loadTitleArt();
  bindSheet();
  loadSheet();
  form.addEventListener("input", saveSheet);
  form.addEventListener("change", saveSheet);

  function buildSheetHtml() {
    return `
      <div class="ficha-layout">
        <div class="ficha-col ficha-col-main">
          <header class="ficha-title-block" aria-label="Cyberpunk pbta">
            <pre class="ficha-title-art" id="ficha-title-art"></pre>
          </header>

          ${field("nombre", "Nombre:\\>")}
          ${field("jugador", "Jugador:\\>")}
          ${field("profesion", "Profesión:\\>")}
          <label class="ficha-line ficha-psique-line">
            <span class="ficha-label">@Psique:\\></span>
            <span class="ficha-psique-fill" aria-hidden="true">${"_".repeat(64)}</span>
            <span class="ficha-boxes">
              ${Array.from({ length: 3 }, (_, i) => boxBtn(`psique-${i}`, "psique")).join("")}
              ${ghostAsteriskBox()}${ghostAsteriskBox()}
            </span>
          </label>

          <div class="ficha-portrait-wrap" aria-label="Foto de personaje">
            <div class="ficha-portrait-cap" aria-hidden="true">┌${" ".repeat(14)}┐</div>
            <div class="ficha-portrait"></div>
            <div class="ficha-portrait-cap" aria-hidden="true">└${" ".repeat(14)}┘</div>
          </div>

          <div class="ficha-section">
            <div class="ficha-line"><span class="ficha-label">Atributos:\\></span></div>
            ${stat("en", "Enlaces Neuronales")}
            ${stat("mc", "Manipulación Cognitiva")}
            ${stat("rc", "Reacción Cinética")}
            ${stat("tm", "Tejido Muscular")}
          </div>

          <div class="ficha-section ficha-salud-section">
            <div class="ficha-line"><span class="ficha-label">Salud:\\></span></div>
            <div class="ficha-salud-rows">${saludRowsHtml()}</div>
          </div>

          <label class="ficha-line ficha-exp-line">
            <span class="ficha-label">Experiencia:\\></span>
            <input class="ficha-input ficha-input-underscore" type="text" name="experiencia" autocomplete="off">
          </label>
        </div>

        ${ledgerColumn("cromos", "Cromos")}
        ${ledgerColumn("chaperia", "Chapería")}
      </div>`;
  }

  function saludRowsHtml() {
    let index = 0;
    return SALUD_ROWS.map((row) => {
      const parts = [];
      if (row.ghostFirst) parts.push(ghostAsteriskBox());
      for (let i = 0; i < row.boxes; i += 1) {
        parts.push(boxBtn(`salud-${index}`, "salud"));
        index += 1;
      }
      const cls = row.falla ? " ficha-salud-row is-falla" : " ficha-salud-row";
      return `<div class="${cls.trim()}">
        <span class="ficha-salud-row-label">${row.label}</span>
        <span class="ficha-salud-arrow" aria-hidden="true">-&gt;</span>
        <span class="ficha-salud-boxes">${parts.join("")}</span>
      </div>`;
    }).join("");
  }

  function ledgerColumn(name, label) {
    const rows = Array.from({ length: LEDGER_ROWS }, (_, i) =>
      `<div class="ficha-ledger-row">
        <span class="ficha-pipe" aria-hidden="true">|</span>
        <input type="text" class="ficha-ledger-line" name="${name}-${i}" data-ledger="${name}" autocomplete="off">
        <span class="ficha-pipe" aria-hidden="true">|</span>
      </div>`
    ).join("");
    return `<div class="ficha-col ficha-col-ledger">
      <div class="ficha-col-head">[${"·".repeat(8)}${label}${"·".repeat(8)}]</div>
      <div class="ficha-ledger-col" data-ledger="${name}">${rows}</div>
    </div>`;
  }

  function field(name, label) {
    return `<label class="ficha-line">${tagLabel(label)}<input class="ficha-input ficha-input-underscore" type="text" name="${name}" autocomplete="off"></label>`;
  }

  function stat(name, label) {
    return `<label class="ficha-line ficha-stat-line">
      <span class="ficha-label">${label}</span>
      <span class="ficha-stat-fill" aria-hidden="true">${"_".repeat(24)}</span>
      <span class="ficha-stat-box">[<input class="ficha-stat-input" type="text" name="${name}" inputmode="numeric" maxlength="2" aria-label="${label}">]</span>
    </label>`;
  }

  function tagLabel(text) {
    return `<span class="ficha-label">${text}</span>`;
  }

  function boxBtn(name, group) {
    return `<button type="button" class="ficha-box" name="${name}" data-group="${group}" aria-pressed="false" aria-label="Casilla">[<span class="ficha-box-inner">&nbsp;&nbsp;&nbsp;</span>]</button>`;
  }

  function ghostAsteriskBox() {
    return `<span class="ficha-box ficha-box-static" aria-hidden="true">[<span class="ficha-ghost"> * </span>]</span>`;
  }

  function bindSheet() {
    form.querySelectorAll(".ficha-box[data-group]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const on = btn.getAttribute("aria-pressed") !== "true";
        btn.setAttribute("aria-pressed", String(on));
        const inner = btn.querySelector(".ficha-box-inner");
        if (inner) inner.innerHTML = on ? "&nbsp;×&nbsp;" : "&nbsp;&nbsp;&nbsp;";
        saveSheet();
      });
    });
  }

  function loadTitleArt() {
    const pre = document.getElementById("ficha-title-art");
    if (!pre) return;
    fetch("data/portada-ascii.txt")
      .then((r) => r.text())
      .then((text) => {
        pre.textContent = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      })
      .catch(() => {
        pre.textContent = "Cyberpunk\nPbtA:\\>/";
      });
  }

  function collect() {
    const data = {};
    for (const el of form.elements) {
      if (!el.name || el.classList.contains("ficha-box") || el.dataset.ledger) continue;
      data[el.name] = el.value;
    }
    for (const col of ["cromos", "chaperia"]) {
      data[col] = [...form.querySelectorAll(`input[data-ledger="${col}"]`)].map((i) => i.value).join("\n");
    }
    data.psique = [...form.querySelectorAll('.ficha-box[data-group="psique"]')].map(
      (b) => b.getAttribute("aria-pressed") === "true"
    );
    data.salud = [...form.querySelectorAll('.ficha-box[data-group="salud"]')].map(
      (b) => b.getAttribute("aria-pressed") === "true"
    );
    return data;
  }

  function saveSheet() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collect()));
    } catch {
      /* quota / private mode */
    }
  }

  function loadSheet() {
    let data;
    try {
      data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      data = null;
    }
    if (!data) return;
    for (const el of form.elements) {
      if (!el.name || el.classList.contains("ficha-box") || el.dataset.ledger) continue;
      if (data[el.name] != null) el.value = data[el.name];
    }
    for (const col of ["cromos", "chaperia"]) {
      if (data[col] == null) continue;
      const lines = String(data[col]).split("\n");
      form.querySelectorAll(`input[data-ledger="${col}"]`).forEach((el, i) => {
        el.value = lines[i] || "";
      });
    }
    applyBoxes("psique", data.psique);
    applyBoxes("salud", data.salud);
  }

  function applyBoxes(group, states) {
    if (!Array.isArray(states)) return;
    form.querySelectorAll(`.ficha-box[data-group="${group}"]`).forEach((btn, i) => {
      const on = !!states[i];
      btn.setAttribute("aria-pressed", String(on));
      const inner = btn.querySelector(".ficha-box-inner");
      if (inner) inner.innerHTML = on ? "&nbsp;×&nbsp;" : "&nbsp;&nbsp;&nbsp;";
    });
  }
})();
