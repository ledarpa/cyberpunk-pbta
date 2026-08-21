/** Logo ASCII compartido: Courier + PbtA:\> en VT323 sin mover /___/ (Y). */
(() => {
  const PROMPT_RE = /^(.*?)(PbtA:\\>|pbta:\\>)(.*)$/i;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function normalize(text) {
    return String(text || "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/\s+$/g, "");
  }

  function format(text) {
    return normalize(text)
      .split("\n")
      .map((line) => {
        const m = PROMPT_RE.exec(line);
        if (!m) return escapeHtml(line);
        const before = m[1] ? escapeHtml(m[1]) : "";
        const prompt = escapeHtml(m[2]);
        const after = m[3] ? escapeHtml(m[3]) : "";
        return (
          before +
          `<span class="pbta-logo-prompt-slot" data-prompt-len="${m[2].length}">` +
          `<span class="pbta-logo-prompt">${prompt}</span>` +
          `</span>` +
          after
        );
      })
      .join("\n");
  }

  function measureWidth(label, fontFamily, fontSize, fontWeight, letterSpacing) {
    const probe = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = [
      "position:absolute",
      "left:-9999px",
      "top:0",
      "visibility:hidden",
      "white-space:pre",
      `font-family:${fontFamily}`,
      `font-size:${fontSize}`,
      `font-weight:${fontWeight}`,
      `letter-spacing:${letterSpacing}`,
      "line-height:1",
    ].join(";");
    probe.textContent = label;
    document.body.appendChild(probe);
    const w = probe.getBoundingClientRect().width;
    document.body.removeChild(probe);
    return w;
  }

  /** Encaja VT323 en el ancho Courier de PbtA:\> dentro de rootEl. */
  function fitPrompt(rootEl) {
    if (!rootEl) return;
    const slot = rootEl.querySelector(".pbta-logo-prompt-slot");
    const prompt = rootEl.querySelector(".pbta-logo-prompt");
    if (!slot || !prompt) return;

    const cs = getComputedStyle(rootEl);
    const label = prompt.textContent || "PbtA:\\>";
    const courierW = measureWidth(
      label,
      '"Courier New", Courier, monospace',
      cs.fontSize,
      cs.fontWeight,
      "0px"
    );
    if (courierW <= 0) return;

    slot.style.width = `${courierW}px`;
    slot.style.minWidth = `${courierW}px`;
    slot.style.maxWidth = `${courierW}px`;

    prompt.style.fontSize = cs.fontSize;
    prompt.style.letterSpacing = "0px";

    const vtW = measureWidth(
      label,
      '"VT323", "Courier New", monospace',
      cs.fontSize,
      "400",
      "0px"
    );
    const glyphs = Math.max(1, label.length - 1);
    if (vtW <= 0) return;

    let spacing = (courierW - vtW) / glyphs;
    prompt.style.letterSpacing = `${spacing}px`;

    const vtW2 = prompt.getBoundingClientRect().width;
    if (Math.abs(vtW2 - courierW) > 0.4) {
      spacing += (courierW - vtW2) / glyphs;
      prompt.style.letterSpacing = `${spacing}px`;
    }
  }

  function paint(pre, text) {
    if (!pre) return;
    pre.innerHTML = format(text);
    fitPrompt(pre);
  }

  window.PBTA_LOGO = { format, fitPrompt, paint, normalize, escapeHtml };
})();
