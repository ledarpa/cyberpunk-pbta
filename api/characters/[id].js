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
    const id = req.query?.id;
    if (!id || typeof id !== "string") {
      json(res, 400, { error: "id requerido" });
      return;
    }

    if (req.method === "GET") {
      const result = await sql`
        SELECT id, name, updated_at, sheet
        FROM characters
        WHERE id = ${id} AND user_id = ${user.id}
        LIMIT 1
      `;
      if (!result.rows[0]) {
        json(res, 404, { error: "Personaje no encontrado" });
        return;
      }
      json(res, 200, { character: mapChar(result.rows[0]) });
      return;
    }

    if (req.method === "PUT") {
      const body = await readBody(req);
      const name =
        body.name != null
          ? String(body.name).trim().slice(0, 64) || "Personaje"
          : null;
      const sheet = body.sheet && typeof body.sheet === "object" ? body.sheet : null;
      if (!name && !sheet) {
        json(res, 400, { error: "Nada que actualizar" });
        return;
      }

      let result;
      if (name && sheet) {
        result = await sql`
          UPDATE characters
          SET name = ${name},
              sheet = ${JSON.stringify(sheet)},
              updated_at = now()
          WHERE id = ${id} AND user_id = ${user.id}
          RETURNING id, name, updated_at, sheet
        `;
      } else if (name) {
        result = await sql`
          UPDATE characters
          SET name = ${name}, updated_at = now()
          WHERE id = ${id} AND user_id = ${user.id}
          RETURNING id, name, updated_at, sheet
        `;
      } else {
        result = await sql`
          UPDATE characters
          SET sheet = ${JSON.stringify(sheet)},
              updated_at = now()
          WHERE id = ${id} AND user_id = ${user.id}
          RETURNING id, name, updated_at, sheet
        `;
      }

      if (!result.rows[0]) {
        json(res, 404, { error: "Personaje no encontrado" });
        return;
      }
      json(res, 200, { character: mapChar(result.rows[0]) });
      return;
    }

    if (req.method === "DELETE") {
      const result = await sql`
        DELETE FROM characters
        WHERE id = ${id} AND user_id = ${user.id}
        RETURNING id
      `;
      if (!result.rows[0]) {
        json(res, 404, { error: "Personaje no encontrado" });
        return;
      }
      json(res, 200, { ok: true });
      return;
    }

    json(res, 405, { error: "Method not allowed" });
  } catch (err) {
    console.error(err);
    json(res, err.statusCode || 500, { error: err.message || "Error de servidor" });
  }
};
