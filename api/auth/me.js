const { json } = require("../_lib/http");
const { requireUser } = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }
  try {
    const user = await requireUser(req);
    json(res, 200, { username: user.username });
  } catch (err) {
    json(res, err.statusCode || 500, { error: err.message || "Error de servidor" });
  }
};
