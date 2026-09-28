'use strict';

const crypto = require('node:crypto');

function parseInitData(initData) {
  const params = new URLSearchParams(String(initData || ''));
  const hash = params.get('hash') || '';
  params.delete('hash');
  const pairs = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = pairs.map(([k, v]) => `${k}=${v}`).join('\n');
  const userRaw = params.get('user');
  let user = null;
  try { user = userRaw ? JSON.parse(userRaw) : null; } catch { user = null; }
  const authDate = Number(params.get('auth_date') || 0);
  return { hash, dataCheckString, user, authDate };
}

function validateInitData(initData, botToken, maxAgeSec = 86400) {
  if (!initData || !botToken) return null;
  const parsed = parseInitData(initData);
  if (!parsed.hash || !parsed.user?.id) return null;
  if (!Number.isFinite(parsed.authDate) || (Date.now() / 1000 - parsed.authDate) > maxAgeSec) return null;
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const check = crypto.createHmac('sha256', secret).update(parsed.dataCheckString).digest('hex');
  const a = Buffer.from(check, 'hex');
  const b = Buffer.from(parsed.hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return parsed.user;
}

function publicSiteUrl() {
  return String(process.env.PUBLIC_SITE_URL || 'https://resstaurant.pp.ua').replace(/\/$/, '');
}

function miniAppUrl() {
  return String(process.env.TELEGRAM_MINI_APP_URL || `${publicSiteUrl()}/telegram`).replace(/\/$/, '');
}

function botUsername() {
  return String(process.env.TELEGRAM_BOT_USERNAME || '').replace(/^@/, '');
}

function botLink() {
  const name = botUsername();
  return name ? `https://t.me/${name}` : '';
}

function paymentUrl(orderNumber, total) {
  const base = process.env.PAYMENT_PROVIDER_URL;
  if (!base) return null;
  try {
    const url = new URL(base);
    url.searchParams.set('order', orderNumber);
    url.searchParams.set('amount', String(total));
    url.searchParams.set('currency', 'TJS');
    return url.toString();
  } catch {
    return null;
  }
}

module.exports = {
  validateInitData,
  publicSiteUrl,
  miniAppUrl,
  botUsername,
  botLink,
  paymentUrl
};
