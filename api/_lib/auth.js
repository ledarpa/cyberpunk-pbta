const bcrypt = require("bcryptjs");
const { SignJWT, jwtVerify } = require("jose");
const { parseCookies, setCookie } = require("./http");

const COOKIE = "pbta_session";
const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;
const TOKEN_DAYS = 30;
const TOKEN_MAX_AGE = TOKEN_DAYS * 24 * 60 * 60;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("Missing or weak JWT_SECRET");
  }
  return new TextEncoder().encode(secret);
}

function validateUsername(username) {
  if (typeof username !== "string" || !USERNAME_RE.test(username)) {
    return "Usuario: 3–32 caracteres (letras, números, _)";
  }
  return null;
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < 6 || password.length > 128) {
    return "Contraseña: mínimo 6 caracteres";
  }
  return null;
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_DAYS}d`)
    .sign(getSecret());
}

async function verifyToken(token) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}

async function requireUser(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE];
  if (!token) {
    const err = new Error("No autenticado");
    err.statusCode = 401;
    throw err;
  }
  try {
    const payload = await verifyToken(token);
    if (!payload?.sub || !payload?.username) {
      const err = new Error("Sesión inválida");
      err.statusCode = 401;
      throw err;
    }
    return { id: String(payload.sub), username: String(payload.username) };
  } catch (e) {
    if (e.statusCode) throw e;
    const err = new Error("Sesión inválida");
    err.statusCode = 401;
    throw err;
  }
}

function setSessionCookie(res, token) {
  setCookie(res, COOKIE, token, { maxAge: TOKEN_MAX_AGE });
}

function clearSessionCookie(res) {
  setCookie(res, COOKIE, "", { clear: true });
}

module.exports = {
  COOKIE,
  TOKEN_MAX_AGE,
  validateUsername,
  validatePassword,
  hashPassword,
  verifyPassword,
  signToken,
  requireUser,
  setSessionCookie,
  clearSessionCookie,
};
