#!/usr/bin/env node
/**
 * Reset / set password de un jugador (admin local).
 *
 * Uso:
 *   npx vercel env pull .env.local
 *   node scripts/reset-player-password.js <username> <nueva_password>
 *
 * Ejemplo:
 *   node scripts/reset-player-password.js neo secreto99
 */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { sql } = require("@vercel/postgres");

function loadEnvLocal() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

async function main() {
  loadEnvLocal();
  if (!process.env.POSTGRES_URL && process.env.DATABASE_URL) {
    process.env.POSTGRES_URL = process.env.DATABASE_URL;
  }
  if (!process.env.POSTGRES_URL) {
    console.error("Falta POSTGRES_URL. Corré: npx vercel env pull .env.local");
    process.exit(1);
  }

  const username = String(process.argv[2] || "").trim();
  const password = String(process.argv[3] || "");
  if (!username || password.length < 6) {
    console.error("Uso: node scripts/reset-player-password.js <username> <nueva_password>");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  const result = await sql`
    UPDATE users
    SET password_hash = ${hash}
    WHERE username = ${username}
    RETURNING id, username
  `;
  if (!result.rows[0]) {
    console.error(`Usuario no encontrado: ${username}`);
    process.exit(1);
  }
  console.log(`OK password actualizado para ${result.rows[0].username}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
