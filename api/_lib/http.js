function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(Object.assign(new Error("Invalid JSON"), { statusCode: 400 }));
      }
    });
    req.on("error", reject);
  });
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (!key) continue;
    out[key] = decodeURIComponent(val);
  }
  return out;
}

function setCookie(res, name, value, { maxAge, clear } = {}) {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  const parts = [
    `${name}=${clear ? "" : encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) parts.push("Secure");
  if (clear) parts.push("Max-Age=0");
  else if (typeof maxAge === "number") parts.push(`Max-Age=${maxAge}`);
  const prev = res.getHeader("Set-Cookie");
  const next = Array.isArray(prev) ? prev.concat(parts.join("; ")) : prev ? [prev, parts.join("; ")] : parts.join("; ");
  res.setHeader("Set-Cookie", next);
}

module.exports = { json, readBody, parseCookies, setCookie };
