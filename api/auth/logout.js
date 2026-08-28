const { json } = require("../_lib/http");
const { clearSessionCookie } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }
  clearSessionCookie(res);
  json(res, 200, { ok: true });
};
