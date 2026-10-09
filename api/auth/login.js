const { sql } = require("../_lib/db");
const { json } = require("../_lib/http");
const {
  readCredentials,
  verifyPassword,
  signToken,
  setSessionCookie,
} = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }
  try {
    const creds = await readCredentials(req, res);
    if (!creds) return;
    const { username, password } = creds;

    const result = await sql`
      SELECT id, username, password_hash
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `;
    const row = result.rows[0];
    if (!row || !(await verifyPassword(password, row.password_hash))) {
      json(res, 401, { error: "Usuario o contraseña incorrectos" });
      return;
    }

    const token = await signToken({ sub: row.id, username: row.username });
    setSessionCookie(res, token);
    json(res, 200, { username: row.username });
  } catch (err) {
    console.error(err);
    json(res, err.statusCode || 500, { error: err.message || "Error de servidor" });
  }
};
