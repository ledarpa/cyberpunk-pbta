const { sql } = require("../_lib/db");
const { json, readBody } = require("../_lib/http");
const {
  validateUsername,
  validatePassword,
  hashPassword,
  signToken,
  setSessionCookie,
} = require("../_lib/auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    json(res, 405, { error: "Method not allowed" });
    return;
  }
  try {
    const body = await readBody(req);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const uErr = validateUsername(username);
    if (uErr) {
      json(res, 400, { error: uErr });
      return;
    }
    const pErr = validatePassword(password);
    if (pErr) {
      json(res, 400, { error: pErr });
      return;
    }

    const passwordHash = await hashPassword(password);
    let row;
    try {
      const result = await sql`
        INSERT INTO users (username, password_hash)
        VALUES (${username}, ${passwordHash})
        RETURNING id, username
      `;
      row = result.rows[0];
    } catch (err) {
      if (err?.code === "23505") {
        json(res, 409, { error: "Ese usuario ya existe" });
        return;
      }
      throw err;
    }

    const token = await signToken({ sub: row.id, username: row.username });
    setSessionCookie(res, token);
    json(res, 201, { username: row.username });
  } catch (err) {
    console.error(err);
    json(res, err.statusCode || 500, { error: err.message || "Error de servidor" });
  }
};
