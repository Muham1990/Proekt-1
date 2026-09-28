'use strict';

const { validateInitData, paymentUrl, botLink, miniAppUrl } = require('./telegram-auth');
const { prepareItems, todayStamp } = require('./place-order');
const { MIN_ORDER_AMOUNT, selectReward, publicClaim } = require('./reward-config');
const statusLib = require('./order-status');
const crypto = require('node:crypto');

const SESSION_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ADDRESS = 'г. Душанбе, проспект Рудаки, 25';

function readInitUser(req) {
  const raw = req.get('x-telegram-init-data') || req.body?.initData || '';
  const user = validateInitData(raw, process.env.TELEGRAM_BOT_TOKEN);
  if (!user) {
    const err = new Error('Откройте Mini App из Telegram');
    err.status = 401;
    throw err;
  }
  return user;
}

function mountTelegramRoutes(app, store, bot, { writeLimit, isName, isPhone, clampText }) {
  app.get('/telegram', (_req, res) => {
    res.sendFile(require('node:path').join(__dirname, '..', 'telegram', 'index.html'));
  });
  app.get('/mini-app', (_req, res) => {
    res.sendFile(require('node:path').join(__dirname, '..', 'telegram', 'index.html'));
  });

  app.post('/api/telegram/session', writeLimit, async (req, res) => {
    try {
      const user = readInitUser(req);
      const row = await store.upsertTelegramCustomer({
        telegramUserId: String(user.id),
        chatId: String(user.id),
        name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Гость',
        username: user.username || ''
      });
      res.json({
        ok: true,
        user: { id: user.id, name: row.name, username: row.username },
        sessionId: row.session_id
      });
    } catch (err) {
      res.status(err.status || 401).json({ error: err.message || 'Telegram временно недоступен. Попробуйте позже.' });
    }
  });

  app.get('/api/telegram/orders', async (req, res) => {
    try {
      const user = readInitUser(req);
      const orders = await store.listOrdersByTelegram(String(user.id));
      res.json(orders.map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        total: o.total,
        status: statusLib.normalize(o.status),
        statusLabel: statusLib.label(o.status),
        items: o.items,
        createdAt: o.created_at
      })));
    } catch (err) {
      res.status(err.status || 401).json({ error: err.message });
    }
  });

  app.get('/api/telegram/rewards', async (req, res) => {
    try {
      const user = readInitUser(req);
      const rows = await store.listRewardsByTelegram(String(user.id));
      res.json(rows.map((row) => ({
        ...publicClaim(row),
        orderNumber: row.order_number || null
      })));
    } catch (err) {
      res.status(err.status || 401).json({ error: err.message });
    }
  });

  app.post('/api/telegram/rewards/spin', writeLimit, async (req, res) => {
    try {
      const user = readInitUser(req);
      const sessionId = String(req.body?.sessionId || '');
      if (!SESSION_RE.test(sessionId)) {
        res.status(400).json({ error: 'Некорректная сессия' });
        return;
      }
      const existing = await store.findRewardClaimBySession(sessionId);
      if (existing) {
        res.status(409).json({ error: 'Подарок уже открыт для этого заказа', claim: publicClaim(existing) });
        return;
      }
      const { prepared, total } = await prepareItems(store, req.body?.items);
      if (total < MIN_ORDER_AMOUNT) {
        res.status(400).json({ error: `Добавьте ещё ${MIN_ORDER_AMOUNT - total} TJS, чтобы получить подарок 🎁` });
        return;
      }
      const prize = selectReward((max) => crypto.randomInt(max));
      const claimId = crypto.randomUUID();
      const row = await store.createRewardClaim({
        id: claimId,
        sessionId,
        rewardId: prize.id,
        rewardName: prize.name,
        cartTotal: total,
        cartHash: prepared.map((i) => `${i.dish_id}:${i.qty}`).sort().join('|'),
        status: 'won',
        telegramUserId: String(user.id)
      });
      res.status(201).json({
        rewardId: prize.id,
        rewardName: prize.name,
        image: prize.image || null,
        rewardType: prize.type,
        claimId,
        status: 'won',
        createdAt: row?.created_at || new Date().toISOString()
      });
    } catch (err) {
      if (err.status === 400) {
        res.status(400).json({ error: err.message });
        return;
      }
      console.warn('Telegram spin:', err.message);
      res.status(500).json({ error: 'Не удалось открыть подарок' });
    }
  });

  app.post('/api/telegram/order', writeLimit, async (req, res) => {
    try {
      const user = readInitUser(req);
      const name = clampText(req.body?.name, 80);
      const phone = clampText(req.body?.phone, 24);
      const fulfillment = req.body?.fulfillment === 'pickup' ? 'pickup' : 'delivery';
      const payment = req.body?.payment_method === 'card' ? 'card' : 'cash';
      const address = clampText(req.body?.address, 200);
      const apartment = clampText(req.body?.apartment, 80);
      const comment = clampText(req.body?.comment, 400);
      if (!isName(name) || !isPhone(phone)) {
        res.status(400).json({ error: 'Проверьте имя и телефон' });
        return;
      }
      if (fulfillment === 'delivery' && address.length < 4) {
        res.status(400).json({ error: 'Укажите адрес доставки' });
        return;
      }
      const { prepared, total } = await prepareItems(store, req.body?.items);
      const stamp = todayStamp();
      const status = payment === 'card' ? 'PENDING_PAYMENT' : 'PENDING_CONFIRMATION';
      const orderNumber = await store.nextOrderNumber();
      const orderId = await store.createOrder({
        orderNumber,
        name,
        phone,
        email: `tg${user.id}@guest.plovtg`,
        address: fulfillment === 'pickup' ? ADDRESS : [address, apartment].filter(Boolean).join(', '),
        date: stamp.date,
        time: stamp.time,
        comment: comment || null,
        total,
        status,
        channel: 'telegram',
        fulfillment,
        payment_method: payment,
        telegram_user_id: String(user.id),
        lat: req.body?.lat != null ? String(req.body.lat) : null,
        lng: req.body?.lng != null ? String(req.body.lng) : null,
        apartment: apartment || null
      }, prepared);
      const claimId = clampText(req.body?.claimId, 80);
      const sessionId = clampText(req.body?.sessionId, 80);
      if (claimId && SESSION_RE.test(sessionId) && total >= MIN_ORDER_AMOUNT) {
        try { await store.attachRewardToOrder({ claimId, sessionId, orderId }); } catch (e) {
          console.warn('Mini App reward attach:', e.message);
        }
      }
      const order = await store.getOrder(orderId);
      if (bot?.notifyAdmin) await bot.notifyAdmin(order);
      if (bot?.notifyCustomer) await bot.notifyCustomer(order);
      const pay = payment === 'card' ? paymentUrl(orderNumber, total) : null;
      res.status(201).json({
        id: orderId,
        orderNumber,
        total,
        status,
        statusLabel: statusLib.label(status),
        paymentUrl: pay,
        message: pay ? 'Заказ создан. Оплатите через Alif.' : 'Заказ принят и передан ресторану.'
      });
    } catch (err) {
      if (err.status === 400 || err.status === 401) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      console.warn('Telegram order:', err.message);
      res.status(500).json({ error: 'Не удалось оформить заказ. Попробуйте ещё раз.' });
    }
  });

  app.get('/api/telegram/config', (_req, res) => {
    res.json({
      botUrl: botLink(),
      miniAppUrl: miniAppUrl(),
      paymentReady: Boolean(process.env.PAYMENT_PROVIDER_URL),
      botReady: Boolean(process.env.TELEGRAM_BOT_TOKEN)
    });
  });
}

module.exports = { mountTelegramRoutes };
