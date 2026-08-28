const { sql, createPool } = require("@vercel/postgres");

function ensureConnectionString() {
  if (process.env.POSTGRES_URL) return;
  if (process.env.DATABASE_URL) {
    process.env.POSTGRES_URL = process.env.DATABASE_URL;
    return;
  }
  if (process.env.POSTGRES_PRISMA_URL) {
    process.env.POSTGRES_URL = process.env.POSTGRES_PRISMA_URL;
  }
}

ensureConnectionString();

function getSql() {
  if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
    throw new Error("Missing POSTGRES_URL");
  }
  ensureConnectionString();
  return sql;
}

module.exports = { getSql, sql, createPool };
