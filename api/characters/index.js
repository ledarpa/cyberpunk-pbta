const { sql } = require("../_lib/db");
const { json, readBody } = require("../_lib/http");
const { requireUser } = require("../_lib/auth");

function mapChar(row) {
  return {
    id: row.id,
    name: row.name,
    updatedAt: row.updated_at,
    sheet: row.sheet,
  };
}

module.exports = async function handler(req, res) {
  try {
    const user = await requireUser(req);

    if (req.method === "GET") {
      const result = await sql`
        SELECT id, name, updated_at
        FROM characters
        WHERE user_id = ${user.id}
        ORDER BY updated_at DESC
      `;
      json(res, 200, {
        characters: result.rows.map((r) => ({
          id: r.id,
          name: r.name,
          updatedAt: r.updated_at,
        })),
      });
      return;
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const name = String(body.name || "Personaje 1").trim().slice(0, 64) || "Personaje 1";
      const sheet = body.sheet && typeof body.sheet === "object" ? body.sheet : {};
      const result = await sql`
        INSERT INTO characters (user_id, name, sheet)
        VALUES (${user.id}, ${name}, ${JSON.stringify(sheet)})
        RETURNING id, name, updated_at, sheet
      `;
      json(res, 201, { character: mapChar(result.rows[0]) });
      return;
    }

    json(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    json(res, err.statusCode || 500, { error: err.message || "Error de servidor" });
  }
};
