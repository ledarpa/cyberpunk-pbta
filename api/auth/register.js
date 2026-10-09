const { sql } = require("../_lib/db");
const { json } = require("../_lib/http");
const {
  readCredentials,
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
    const creds = await readCredentials(req, res);
    if (!creds) return;
    const { username, password } = creds;

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
