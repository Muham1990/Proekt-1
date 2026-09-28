'use strict';

const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');

const COOKIE = 'plovtg_admin';
const SESSION_HOURS = 12;

function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    out[key] = decodeURIComponent(trimmed.slice(eq + 1));
  }
  return out;
}

function cookieSecure() {
  return process.env.COOKIE_SECURE === '1'
    || Boolean(process.env.RAILWAY_ENVIRONMENT)
    || process.env.NODE_ENV === 'production';
}

function cookieFlags() {
  const parts = ['HttpOnly', 'SameSite=Lax', 'Path=/'];
  if (cookieSecure()) parts.push('Secure');
  return parts.join('; ');
}

function cookieHeader(token) {
  const maxAge = SESSION_HOURS * 60 * 60;
  return `${COOKIE}=${encodeURIComponent(token)}; ${cookieFlags()}; Max-Age=${maxAge}`;
}

function clearCookieHeader() {
  return `${COOKIE}=; ${cookieFlags()}; Max-Age=0`;
}

function requireAdmin(store) {
  return async (req, res, next) => {
    const token = parseCookies(req)[COOKIE];
    if (!token) {
      res.status(401).json({ error: 'Требуется вход администратора' });
      return;
    }
    const row = await store.getSession(token);
    if (!row) {
      res.status(401).json({ error: 'Сессия истекла, войдите снова' });
      return;
    }
    req.adminToken = token;
    next();
  };
}

module.exports = {
  COOKIE,
  SESSION_HOURS,
  hashPassword,
  verifyPassword,
  createToken,
  parseCookies,
  cookieHeader,
  clearCookieHeader,
  requireAdmin
};
