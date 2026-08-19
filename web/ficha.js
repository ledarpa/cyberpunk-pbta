/** Hoja de personaje digital — editable, estética manual. */
(() => {
  const STORAGE_KEY = "pbta-ficha-v1";
  const SALUD_MARKERS = new Set([5, 10, 15, 20]); // 0-based; etiquetas -1 -2 -3 Falla
  const SALUD_LABELS = [
    { at: 5, text: "-1" },
    { at: 10, text: "-2" },
    { at: 15, text: "-3" },
    { at: 20, text: "Falla", sub: "integral" },
  ];
  const LEDGER_ROWS = 30;

  const form = document.getElementById("ficha-form");
  if (!form) return;

  form.innerHTML = buildSheetHtml();
  bindSheet();
  loadSheet();
  form.addEventListener("input", saveSheet);
  form.addEventListener("change", saveSheet);

  function buildSheetHtml() {
    const psique = Array.from({ length: 5 }, (_, i) => boxBtn(`psique-${i}`, "psique")).join("");
    const saludLabels = SALUD_LABELS.map(({ at, text, sub }) => {
      const cls = sub ? "ficha-salud-label is-falla" : "ficha-salud-label";
      const inner = sub
        ? `<span>${text}</span><span>${sub}</span>`
        : `<span>${text}</span>`;
      return `<div class="${cls}" style="--at:${at}">${inner}</div>`;
    }).join("");
    const salud = Array.from({ length: 23 }, (_, i) => {
      if (SALUD_MARKERS.has(i)) {
        return `<span class="ficha-mark" aria-hidden="true">[*]</span>`;
      }
      return boxBtn(`salud-${i}`, "salud");
    }).join("");
    const ledger = (name, label) => {
      const rows = Array.from({ length: LEDGER_ROWS }, (_, i) =>
        `<div class="ficha-ledger-row">
          <span class="ficha-pipe" aria-hidden="true">|</span>
          <input type="text" class="ficha-ledger-line" name="${name}-${i}" data-ledger="${name}" autocomplete="off">
          <span class="ficha-pipe" aria-hidden="true">|</span>
        </div>`
      ).join("");
      return `<div class="ficha-col"><div class="ficha-col-head">[${"·".repeat(8)}${label}${"·".repeat(8)}]</div><div class="ficha-ledger-col" data-ledger="${name}">${rows}</div></div>`;
    };

    return `
      <div class="ficha-block ficha-identity">
        <div class="ficha-portrait-cap" aria-hidden="true">┌${" ".repeat(14)}┐</div>
        <div class="ficha-identity-grid">
          <div class="ficha-side ficha-side-left">
            ${field("nombre", "Nombre:\\>")}
            ${field("jugador", "Jugador:\\>")}
            ${field("profesion", "Profesión:\\>")}
            <label class="ficha-line ficha-psique-line">
              <span class="ficha-label">@Psique:\\></span>
              <span class="ficha-boxes">${psique}</span>
            </label>
          </div>
          <div class="ficha-portrait" aria-label="Retrato"></div>
          <div class="ficha-side ficha-side-right">
            ${stat("en", "Enlaces Neuronales")}
            ${stat("mc", "Manipulación Cognitiva")}
            ${stat("rc", "Reacción Cinética")}
            ${stat("tm", "Tejido Muscular")}
          </div>
        </div>
        <div class="ficha-portrait-cap" aria-hidden="true">└${" ".repeat(14)}┘</div>
      </div>

      <div class="ficha-block ficha-salud-block">
        <div class="ficha-salud-labels" aria-hidden="true">${saludLabels}</div>
        <label class="ficha-line ficha-salud-line">
          <span class="ficha-label">Salud:\\>_</span>
          <span class="ficha-salud-track">${salud}</span>
        </label>
      </div>

      <div class="ficha-block ficha-columns">${ledger("cromos", "Cromos")}${ledger("chaperia", "Chapería")}</div>

      <label class="ficha-block ficha-exp">
        <span class="ficha-label">Experiencia:\\></span>
        <input class="ficha-input ficha-input-underscore" type="text" name="experiencia" autocomplete="off">
      </label>`;
  }

  function field(name, label) {
    return `<label class="ficha-line">${tagLabel(label)}<input class="ficha-input ficha-input-underscore" type="text" name="${name}" autocomplete="off"></label>`;
  }

  function stat(name, label) {
    return `<label class="ficha-line ficha-stat-line"><span class="ficha-label">${label}</span><span class="ficha-stat-dots" aria-hidden="true">${".".repeat(6)}</span><span class="ficha-stat-box">[ <input class="ficha-stat-input" type="text" name="${name}" inputmode="numeric" maxlength="2" aria-label="${label}"> ]</span></label>`;
  }

  function tagLabel(text) {
    return `<span class="ficha-label">${text}</span>`;
  }

  function boxBtn(name, group) {
    return `<button type="button" class="ficha-box" name="${name}" data-group="${group}" aria-pressed="false" aria-label="Casilla">[ <span class="ficha-box-mark" hidden>×</span> ]</button>`;
  }

  function bindSheet() {
    form.querySelectorAll(".ficha-box").forEach((btn) => {
      btn.addEventListener("click", () => {
        const on = btn.getAttribute("aria-pressed") !== "true";
        btn.setAttribute("aria-pressed", String(on));
        btn.querySelector(".ficha-box-mark").hidden = !on;
        saveSheet();
      });
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
      btn.querySelector(".ficha-box-mark").hidden = !on;
    });
  }
})();
