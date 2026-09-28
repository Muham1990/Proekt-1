'use strict';

const crypto = require('node:crypto');
const { publicSiteUrl } = require('./telegram-auth');
const statusLib = require('./order-status');

const PHONE = '+992 30 11 55 45';

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function alifKey() {
  return String(process.env.ALIF_KEY || '').trim();
}

function alifPassword() {
  return String(process.env.ALIF_PASSWORD || '').trim();
}

function alifReady() {
  return Boolean(alifKey() && alifPassword());
}

function paylinkUrl(orderNumber, total) {
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

function paymentReady() {
  return alifReady() || Boolean(String(process.env.PAYMENT_PROVIDER_URL || '').trim());
}

function hashedPassword() {
  return crypto.createHmac('sha256', alifKey()).update(alifPassword()).digest('hex');
}

function sign(data) {
  return crypto.createHmac('sha256', hashedPassword()).update(data).digest('hex');
}

function checkoutEndpoint() {
  const custom = String(process.env.ALIF_CHECKOUT_URL || '').trim();
  if (custom) return custom.replace(/\/$/, '') + '/';
  if (String(process.env.ALIF_ENV || '').toLowerCase() === 'test') {
    return 'https://test-web.alif.tj/';
  }
  return 'https://web.alif.tj/';
}

function amountStr(total) {
  return Number(total).toFixed(2);
}

function alifPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('992')) return digits;
  if (digits.length === 9) return `992${digits}`;
  return digits || '992000000000';
}

function payToken(orderNumber) {
  const secret = alifPassword() || process.env.TELEGRAM_BOT_TOKEN || 'plovtg-pay';
  return crypto.createHmac('sha256', secret).update(String(orderNumber)).digest('hex').slice(0, 20);
}

function checkoutPageUrl(orderNumber) {
  const t = payToken(orderNumber);
  return `${publicSiteUrl()}/pay/${encodeURIComponent(orderNumber)}?t=${encodeURIComponent(t)}`;
}

function tokenOk(orderNumber, token) {
  const expected = payToken(orderNumber);
  const a = Buffer.from(String(token || ''));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function callbackUrl() {
  return `${publicSiteUrl()}/api/payments/alif/callback`;
}

function alifFormFields(order) {
  const key = alifKey();
  const orderId = String(order.order_number);
  const amount = amountStr(order.total);
  const cb = callbackUrl();
  const token = sign(`${key}${orderId}${amount}${cb}`);
  return {
    action: checkoutEndpoint(),
    key,
    token,
    orderId,
    amount,
    callbackUrl: cb,
    returnUrl: `${publicSiteUrl()}/pay/${encodeURIComponent(orderId)}/return?t=${encodeURIComponent(payToken(orderId))}`,
    gate: String(process.env.ALIF_GATE || 'km'),
    info: `PLOV TG заказ ${orderId}`,
    phone: alifPhone(order.phone),
    email: order.email || ''
  };
}

function verifyCallbackToken(payload) {
  const orderId = String(payload.orderId || '');
  const status = String(payload.status || '');
  const transactionId = String(payload.transactionId || '');
  const token = String(payload.token || '');
  if (!orderId || !status || !transactionId || !token) return false;
  const expected = sign(`${orderId}${status}${transactionId}`);
  const a = Buffer.from(token, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}

function amountsMatch(orderTotal, paid) {
  const a = Number(orderTotal);
  const b = Number(paid);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) < 0.009;
}

function pageShell(title, body) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{--black:#0a0806;--gold:#d9b56a;--cream:#f3ead9;--line:rgba(217,181,106,.4)}
  *{box-sizing:border-box}
  body{margin:0;min-height:100dvh;background:#0a0806;color:var(--cream);font-family:Manrope,sans-serif;
    display:flex;align-items:center;justify-content:center;padding:24px}
  .card{width:min(440px,100%);border:1px solid var(--line);border-radius:24px;padding:28px;
    background:radial-gradient(120% 80% at 10% 0%,rgba(217,181,106,.16),transparent 50%),#120c08}
  .kicker{letter-spacing:.2em;text-transform:uppercase;color:var(--gold);font-size:.7rem;margin:0}
  h1{font-family:'Cormorant Garamond',serif;margin:.35rem 0 12px;letter-spacing:.08em}
  p{line-height:1.5;color:#f3ead9}
  .sum{display:flex;justify-content:space-between;padding-top:12px;margin-top:12px;border-top:1px dashed var(--line);font-size:1.1rem}
  .btn{display:block;text-align:center;text-decoration:none;border:0;width:100%;min-height:48px;border-radius:999px;
    margin:10px 0 0;padding:12px 16px;font:700 1rem Manrope,sans-serif;cursor:pointer}
  .gold{background:linear-gradient(100deg,#8a5a2c,#f3d99c 45%,#d9b56a);color:#241608}
  .ghost{background:transparent;color:#f3d99c;border:1px solid var(--line)}
  .hint{font-size:.85rem;color:#d9b56a}
</style>
</head>
<body>
<main class="card">${body}</main>
</body>
</html>`;
}

function payPageHtml(order, queryToken) {
  const number = order.order_number;
  const sum = `${order.total} TJS`;
  if (String(order.status) === 'PAID' || statusLib.normalize(order.status) === 'PAID') {
    return pageShell('Оплата получена', `
      <p class="kicker">PLOV TG</p>
      <h1>Оплата получена</h1>
      <p>Заказ №${esc(number)} оплачен через Alif.</p>
      <div class="sum"><span>Сумма</span><strong>${esc(sum)}</strong></div>
      <a class="btn gold" href="https://t.me/resstaurantbot">Вернуться в Telegram</a>`);
  }

  if (alifReady() && String(order.payment_method) === 'card') {
    const f = alifFormFields(order);
    return pageShell('Оплата через Alif', `
      <p class="kicker">PLOV TG</p>
      <h1>Переход в Alif</h1>
      <p>Заказ №${esc(number)}. Сейчас откроется защищённая страница Alif. Данные карты мы не храним.</p>
      <div class="sum"><span>К оплате</span><strong>${esc(sum)}</strong></div>
      <form id="alifPayForm" method="post" action="${esc(f.action)}">
        <input type="hidden" name="key" value="${esc(f.key)}">
        <input type="hidden" name="token" value="${esc(f.token)}">
        <input type="hidden" name="orderId" value="${esc(f.orderId)}">
        <input type="hidden" name="amount" value="${esc(f.amount)}">
        <input type="hidden" name="callbackUrl" value="${esc(f.callbackUrl)}">
        <input type="hidden" name="returnUrl" value="${esc(f.returnUrl)}">
        <input type="hidden" name="gate" value="${esc(f.gate)}">
        <input type="hidden" name="info" value="${esc(f.info)}">
        <input type="hidden" name="phone" value="${esc(f.phone)}">
        <input type="hidden" name="email" value="${esc(f.email)}">
        <button class="btn gold" type="submit">Оплатить через Alif</button>
      </form>
      <script>setTimeout(function(){document.getElementById('alifPayForm').submit()},400)</script>`);
  }

  const link = paylinkUrl(number, order.total);
  if (link) {
    return pageShell('Оплата через Alif', `
      <p class="kicker">PLOV TG</p>
      <h1>Оплата через Alif</h1>
      <p>Заказ №${esc(number)}.</p>
      <div class="sum"><span>К оплате</span><strong>${esc(sum)}</strong></div>
      <a class="btn gold" href="${esc(link)}">Открыть Alif Paylink</a>`);
  }

  const cashAction = `/api/payments/cash?order=${encodeURIComponent(number)}&t=${encodeURIComponent(queryToken || '')}`;
  return pageShell('Оплата картой недоступна', `
    <p class="kicker">PLOV TG</p>
    <h1>Alif ещё не подключён</h1>
    <p>Заказ <b>№${esc(number)}</b> сохранён, но страница Alif не откроется, пока ресторан не получит ключ эквайринга в Alif.</p>
    <div class="sum"><span>Сумма</span><strong>${esc(sum)}</strong></div>
    <p class="hint">Можно оплатить при получении — заказ передадим на кухню.</p>
    <form method="post" action="${esc(cashAction)}">
      <button class="btn gold" type="submit">Оплачу при получении</button>
    </form>
    <a class="btn ghost" href="tel:+992301155445">Позвонить ${esc(PHONE)}</a>`);
}

function returnPageHtml(order, paid) {
  if (paid) {
    return pageShell('Спасибо', `
      <p class="kicker">PLOV TG</p>
      <h1>Спасибо за оплату</h1>
      <p>Заказ №${esc(order.order_number)} оплачен. Ресторан получил уведомление.</p>
      <a class="btn gold" href="https://t.me/resstaurantbot">Открыть бота</a>`);
  }
  return pageShell('Проверяем оплату', `
    <p class="kicker">PLOV TG</p>
    <h1>Проверяем оплату</h1>
    <p>Если вы оплатили заказ №${esc(order.order_number)}, статус обновится после подтверждения Alif. Не закрывайте Telegram.</p>
    <a class="btn gold" href="https://t.me/resstaurantbot">Вернуться в бота</a>`);
}

async function markPaid(store, bot, order, transactionId) {
  if (statusLib.normalize(order.status) === 'PAID') return order;
  await store.updateOrderStatus(order.id, 'PAID');
  const updated = await store.getOrder(order.id);
  if (bot?.notifyCustomer) await bot.notifyCustomer(updated);
  if (bot?.notifyAdmin) await bot.notifyAdmin(updated);
  return updated;
}

async function checkAlifStatus(orderNumber) {
  const key = alifKey();
  const token = sign(`${key}${orderNumber}`);
  const endpoint = checkoutEndpoint().replace(/\/$/, '') + '/checktxn';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: orderNumber, key, token }),
    signal: AbortSignal.timeout(12000)
  });
  return res.json().catch(() => ({}));
}

function mountPaymentRoutes(app, store, bot) {
  app.get('/pay/:orderNumber', async (req, res) => {
    const orderNumber = String(req.params.orderNumber || '');
    const order = await store.getOrderByNumber(orderNumber);
    if (!order) {
      res.status(404).send(pageShell('Заказ не найден', '<h1>Заказ не найден</h1><p>Проверьте номер или оформите заказ заново.</p>'));
      return;
    }
    if (!tokenOk(orderNumber, req.query.t)) {
      res.status(403).send(pageShell('Ссылка недействительна', '<h1>Ссылка на оплату недействительна</h1><p>Откройте оплату из Telegram или корзины.</p>'));
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(payPageHtml(order, req.query.t));
  });

  app.get('/pay/:orderNumber/return', async (req, res) => {
    const orderNumber = String(req.params.orderNumber || '');
    const order = await store.getOrderByNumber(orderNumber);
    if (!order || !tokenOk(orderNumber, req.query.t)) {
      res.status(404).send(pageShell('Заказ не найден', '<h1>Заказ не найден</h1>'));
      return;
    }
    let paid = statusLib.normalize(order.status) === 'PAID';
    if (!paid && alifReady()) {
      try {
        const data = await checkAlifStatus(orderNumber);
        if (data.status === 'ok' && verifyCallbackToken(data) && amountsMatch(order.total, data.amount)) {
          await markPaid(store, bot, order, data.transactionId);
          paid = true;
        }
      } catch (err) {
        console.warn('Alif checktxn:', err.message);
      }
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(returnPageHtml(order, paid));
  });

  app.post('/api/payments/alif/callback', async (req, res) => {
    if (!alifReady()) {
      res.status(503).json({ error: 'Alif не настроен' });
      return;
    }
    const payload = req.body || {};
    if (!verifyCallbackToken(payload)) {
      res.status(401).json({ error: 'Некорректная подпись Alif' });
      return;
    }
    const order = await store.getOrderByNumber(payload.orderId);
    if (!order) {
      res.status(404).json({ error: 'Заказ не найден' });
      return;
    }
    if (payload.status === 'ok') {
      if (!amountsMatch(order.total, payload.amount)) {
        res.status(409).json({ error: 'Сумма не совпадает' });
        return;
      }
      await markPaid(store, bot, order, payload.transactionId);
    }
    res.json({ ok: true });
  });

  app.post('/api/payments/cash', async (req, res) => {
    const orderNumber = String(req.query.order || req.body?.order || '');
    const token = String(req.query.t || req.body?.t || '');
    const order = await store.getOrderByNumber(orderNumber);
    if (!order || !tokenOk(orderNumber, token)) {
      res.status(403).send(pageShell('Нельзя сменить оплату', '<h1>Ссылка недействительна</h1>'));
      return;
    }
    if (statusLib.normalize(order.status) === 'PENDING_PAYMENT') {
      await store.updateOrderStatus(order.id, 'PENDING_CONFIRMATION');
      const updated = await store.getOrder(order.id);
      if (bot?.notifyAdmin) await bot.notifyAdmin(updated);
      if (bot?.notifyCustomer) await bot.notifyCustomer(updated);
    }
    res.send(pageShell('Заказ передан на кухню', `
      <p class="kicker">PLOV TG</p>
      <h1>Оплата при получении</h1>
      <p>Заказ №${esc(orderNumber)} принят. Оплатите курьеру или в ресторане.</p>
      <a class="btn gold" href="https://t.me/resstaurantbot">Открыть бота</a>`));
  });
}

module.exports = {
  mountPaymentRoutes,
  checkoutPageUrl,
  paymentReady,
  alifReady,
  paylinkUrl
};
