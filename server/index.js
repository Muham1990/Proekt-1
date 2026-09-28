'use strict';

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createStore } = require('./store');
const { sendWelcomeEmail, sendOtpEmail } = require('./email');
const {
  MIN_ORDER_AMOUNT,
  selectReward,
  publicPrizes,
  publicClaim
} = require('./reward-config');
const { startBot } = require('./telegram-bot');
const { mountTelegramRoutes } = require('./telegram-routes');
const { mountPaymentRoutes, alifReady } = require('./payments');
const { botLink, miniAppUrl } = require('./telegram-auth');
const statusLib = require('./order-status');
const crypto = require('node:crypto');
const {
  verifyPassword,
  createToken,
  cookieHeader,
  clearCookieHeader,
  requireAdmin,
  SESSION_HOURS
} = require('./auth');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function isName(v) {
  return typeof v === 'string' && v.trim().length >= 2 && v.trim().length <= 80;
}
function isEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) && v.length <= 120;
}
function isPhone(v) {
  return typeof v === 'string' && /^[+\d][\d\s\-()]{6,20}$/.test(v.trim());
}
function isFutureDate(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}
function isTime(v) {
  return typeof v === 'string' && /^\d{2}:\d{2}$/.test(v);
}
function clampText(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

const SESSION_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function publicSiteUrl() {
  return String(process.env.PUBLIC_SITE_URL || 'https://web-production-d58c8.up.railway.app').replace(/\/$/, '');
}

async function main() {
  loadEnv();
  const store = await createStore();
  const bot = await startBot(store);
  const PORT = Number(process.env.PORT) || 3000;
  const ROOT = path.join(__dirname, '..');
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  app.use((req, res, next) => {
    if (req.path === '/api/telegram/receipt') return next();
    express.json({ limit: '32kb' })(req, res, next);
  });
  app.use(express.urlencoded({ extended: false, limit: '32kb' }));

  app.use('/vendor/gsap', express.static(path.join(ROOT, 'node_modules/gsap')));

  app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
  }));

  const writeLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Слишком много заявок. Подождите несколько минут.' }
  });
  const loginLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 12,
    message: { error: 'Слишком много попыток входа.' }
  });

  app.use(['/data', '/server', '/node_modules'], (_req, res) => {
    res.status(403).json({ error: 'Forbidden' });
  });

  app.get('/api/config', (_req, res) => {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
      siteUrl: publicSiteUrl(),
      telegramBotUrl: botLink(),
      telegramMiniAppUrl: miniAppUrl()
    });
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      name: 'PLOV TG API',
      db: store.driver,
      email: {
        resend: Boolean(process.env.RESEND_API_KEY),
        supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
      },
      telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      payments: {
        alif: alifReady(),
        paylink: Boolean(process.env.PAYMENT_PROVIDER_URL)
      },
      time: new Date().toISOString()
    });
  });

  app.get('/api/dishes', async (_req, res) => {
    res.json(await store.listDishes(true));
  });

  app.get('/api/dishes/:id', async (req, res) => {
    const row = await store.getDish(req.params.id, true);
    if (!row) {
      res.status(404).json({ error: 'Блюдо не найдено' });
      return;
    }
    res.json(row);
  });

  app.post('/api/auth/send-code', loginLimit, async (req, res) => {
    const name = clampText(req.body?.name, 80);
    const email = clampText(req.body?.email, 120).toLowerCase();
    if (!isName(name) || !isEmail(email)) {
      res.status(400).json({ error: 'Укажите имя и корректный email' });
      return;
    }
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const codeHash = crypto.createHash('sha256').update(`${email}:${code}`).digest('hex');
    try {
      await store.saveEmailCode(email, name, codeHash, expiresAt);
      const mail = await sendOtpEmail(name, email, code);
      res.json({ ok: true, emailSent: mail.sent, emailVia: mail.via });
    } catch (err) {
      console.warn('send-code:', err.message || err);
      res.status(500).json({ error: 'Не удалось отправить код' });
    }
  });

  app.post('/api/auth/verify-code', loginLimit, async (req, res) => {
    const email = clampText(req.body?.email, 120).toLowerCase();
    const code = String(req.body?.code || '').replace(/\D/g, '');
    if (!isEmail(email) || code.length !== 6) {
      res.status(400).json({ error: 'Введите email и 6-значный код' });
      return;
    }
    try {
      const row = await store.getEmailCode(email);
      if (!row) {
        res.status(400).json({ error: 'Сначала запросите код' });
        return;
      }
      if (Number(row.attempts) >= 5) {
        await store.deleteEmailCode(email);
        res.status(429).json({ error: 'Слишком много попыток. Запросите код снова.' });
        return;
      }
      const exp = new Date(row.expires_at).getTime();
      if (!Number.isFinite(exp) || exp < Date.now()) {
        await store.deleteEmailCode(email);
        res.status(400).json({ error: 'Код истёк. Запросите новый.' });
        return;
      }
      const expected = crypto.createHash('sha256').update(`${email}:${code}`).digest('hex');
      const a = Buffer.from(expected);
      const b = Buffer.from(String(row.code_hash));
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        await store.bumpEmailCodeAttempts(email);
        res.status(400).json({ error: 'Неверный код' });
        return;
      }
      const guest = await store.markGuestVerified(email, row.name);
      await store.deleteEmailCode(email);
      res.json({ ok: true, guest: { id: guest.id, name: guest.name, email: guest.email } });
    } catch (err) {
      console.warn('verify-code:', err.message || err);
      res.status(500).json({ error: 'Не удалось подтвердить код' });
    }
  });

  app.post('/api/guests', writeLimit, async (req, res) => {
    const name = clampText(req.body?.name, 80);
    const email = clampText(req.body?.email, 120).toLowerCase();
    if (!isName(name) || !isEmail(email)) {
      res.status(400).json({ error: 'Укажите имя и корректный email' });
      return;
    }
    try {
      const existing = await store.findGuest(email);
      const guest = existing || await store.createGuest(name, email);
      const mail = await sendWelcomeEmail(name, email);
      res.status(existing ? 200 : 201).json({
        guest,
        returning: Boolean(existing),
        emailSent: mail.sent,
        emailVia: mail.via
      });
    } catch {
      res.status(500).json({ error: 'Не удалось сохранить гостя' });
    }
  });

  app.post('/api/reservations', writeLimit, async (req, res) => {
    const name = clampText(req.body?.name, 80);
    const phone = clampText(req.body?.phone, 24);
    const guests = Number(req.body?.guests);
    const date = clampText(req.body?.date, 10);
    const time = clampText(req.body?.time, 5);
    const comment = clampText(req.body?.comment, 400);
    if (!isName(name) || !isPhone(phone) || !Number.isInteger(guests) || guests < 1 || guests > 50) {
      res.status(400).json({ error: 'Проверьте имя, телефон и число гостей (1–50)' });
      return;
    }
    if (!isFutureDate(date) || !isTime(time)) {
      res.status(400).json({ error: 'Укажите корректные дату и время' });
      return;
    }
    const id = await store.createReservation({ name, phone, guests, date, time, comment: comment || null });
    res.status(201).json({
      id,
      status: 'pending',
      message: 'Бронь принята. Мы подтвердим её в течение 15 минут.'
    });
  });

  app.post('/api/orders', writeLimit, async (req, res) => {
    const name = clampText(req.body?.name, 80);
    const phone = clampText(req.body?.phone, 24);
    const email = clampText(req.body?.email, 120).toLowerCase();
    const address = clampText(req.body?.address, 200);
    const date = clampText(req.body?.date, 10);
    const time = clampText(req.body?.time, 5);
    const comment = clampText(req.body?.comment, 400);
    const items = Array.isArray(req.body?.items) ? req.body.items : [];

    if (!isName(name) || !isPhone(phone) || !isEmail(email) || address.length < 4) {
      res.status(400).json({ error: 'Проверьте имя, телефон, email и адрес доставки' });
      return;
    }
    const guest = await store.findGuest(email);
    const verified = guest && (guest.email_verified === true || guest.email_verified === 1);
    if (!verified) {
      res.status(403).json({ error: 'Подтвердите email, чтобы оформить заказ' });
      return;
    }
    if (!isFutureDate(date) || !isTime(time)) {
      res.status(400).json({ error: 'Укажите корректные дату и время доставки' });
      return;
    }
    if (items.length === 0 || items.length > 40) {
      res.status(400).json({ error: 'Корзина пуста' });
      return;
    }

    const prepared = [];
    let total = 0;
    for (const item of items) {
      const qty = Number(item?.qty);
      if (!item?.id || !Number.isInteger(qty) || qty < 1 || qty > 20) {
        res.status(400).json({ error: 'Некорректный состав заказа' });
        return;
      }
      const dish = await store.getDish(item.id, true);
      if (!dish) {
        res.status(400).json({ error: `Блюдо «${item.id}» недоступно` });
        return;
      }
      total += dish.price * qty;
      prepared.push({
        dish_id: dish.id,
        name_snapshot: dish.name.ru,
        price: dish.price,
        qty
      });
    }

    try {
      const orderNumber = await store.nextOrderNumber();
      const orderId = await store.createOrder({
        orderNumber, name, phone, email, address, date, time, comment: comment || null, total
      }, prepared);
      const claimId = clampText(req.body?.claimId, 80);
      const sessionId = clampText(req.body?.sessionId, 80);
      if (claimId && SESSION_RE.test(sessionId) && total >= MIN_ORDER_AMOUNT) {
        try {
          await store.attachRewardToOrder({ claimId, sessionId, orderId });
        } catch (attachErr) {
          console.warn('Reward attach:', attachErr.message || attachErr);
        }
      }
      res.status(201).json({
        id: orderId,
        orderNumber,
        total,
        status: 'new',
        message: 'Заказ принят и передан на кухню.'
      });
    } catch (err) {
      console.warn('Order create:', err.message || err);
      res.status(500).json({ error: 'Не удалось сохранить заказ. Попробуйте ещё раз.' });
    }
  });

  app.get('/api/rewards/config', (_req, res) => {
    res.json({
      minOrderAmount: MIN_ORDER_AMOUNT,
      currency: 'TJS',
      enabled: true,
      prizes: publicPrizes()
    });
  });

  app.get('/api/rewards/status', async (req, res) => {
    const sessionId = String(req.query.sessionId || '');
    if (!SESSION_RE.test(sessionId)) {
      res.status(400).json({ error: 'Некорректная сессия' });
      return;
    }
    const row = await store.findRewardClaimBySession(sessionId);
    res.json({ claim: publicClaim(row) });
  });

  app.post('/api/rewards/spin', writeLimit, async (req, res) => {
    const sessionId = String(req.body?.sessionId || '');
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!SESSION_RE.test(sessionId)) {
      res.status(400).json({ error: 'Некорректная сессия' });
      return;
    }
    if (items.length === 0 || items.length > 40) {
      res.status(400).json({ error: 'Корзина пуста' });
      return;
    }

    const existing = await store.findRewardClaimBySession(sessionId);
    if (existing) {
      res.status(409).json({
        error: 'Подарок уже открыт для этого заказа',
        claim: publicClaim(existing)
      });
      return;
    }

    let total = 0;
    const parts = [];
    for (const item of items) {
      const qty = Number(item?.qty);
      if (!item?.id || !Number.isInteger(qty) || qty < 1 || qty > 20) {
        res.status(400).json({ error: 'Некорректный состав заказа' });
        return;
      }
      const dish = await store.getDish(item.id, true);
      if (!dish) {
        res.status(400).json({ error: `Блюдо «${item.id}» недоступно` });
        return;
      }
      total += dish.price * qty;
      parts.push(`${item.id}:${qty}`);
    }

    if (total < MIN_ORDER_AMOUNT) {
      res.status(400).json({
        error: `Добавьте ещё ${MIN_ORDER_AMOUNT - total} сомони, чтобы открыть подарок`
      });
      return;
    }

    const prize = selectReward((max) => crypto.randomInt(max));
    const claimId = crypto.randomUUID();
    try {
      const row = await store.createRewardClaim({
        id: claimId,
        sessionId,
        rewardId: prize.id,
        rewardName: prize.name,
        cartTotal: total,
        cartHash: parts.sort().join('|'),
        status: 'won'
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
      const again = await store.findRewardClaimBySession(sessionId);
      if (again) {
        res.status(409).json({
          error: 'Подарок уже открыт для этого заказа',
          claim: publicClaim(again)
        });
        return;
      }
      console.warn('Reward spin:', err.message || err);
      res.status(500).json({ error: 'Не удалось открыть подарок' });
    }
  });

  app.post('/api/rewards/attach', writeLimit, async (req, res) => {
    const claimId = clampText(req.body?.claimId, 80);
    const sessionId = clampText(req.body?.sessionId, 80);
    const orderId = Number(req.body?.orderId);
    if (!claimId || !SESSION_RE.test(sessionId) || !Number.isInteger(orderId) || orderId < 1) {
      res.status(400).json({ error: 'Некорректные данные подарка' });
      return;
    }
    const row = await store.findRewardClaimById(claimId);
    if (!row || row.session_id !== sessionId) {
      res.status(404).json({ error: 'Подарок не найден' });
      return;
    }
    await store.attachRewardToOrder({ claimId, sessionId, orderId });
    const next = await store.findRewardClaimById(claimId);
    res.json(publicClaim(next));
  });

  app.get('/api/reviews', async (_req, res) => {
    res.json(await store.listReviews(false));
  });

  app.post('/api/reviews', writeLimit, async (req, res) => {
    const name = clampText(req.body?.name, 80);
    const text = clampText(req.body?.text, 600);
    const city = clampText(req.body?.city, 80);
    const rating = Number(req.body?.rating);
    if (!isName(name) || text.length < 8) {
      res.status(400).json({ error: 'Укажите имя и отзыв не короче 8 символов' });
      return;
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Оценка от 1 до 5' });
      return;
    }
    await store.createReview({ name, text, rating, city: city || null });
    res.status(201).json({ message: 'Спасибо! Отзыв отправлен на модерацию.' });
  });

  const admin = requireAdmin(store);

  app.post('/api/admin/login', loginLimit, async (req, res) => {
    const username = clampText(req.body?.username, 40);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const user = await store.getAdmin(username);
    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: 'Неверный логин или пароль' });
      return;
    }
    const token = createToken();
    await store.createSession(token, SESSION_HOURS);
    res.setHeader('Set-Cookie', cookieHeader(token));
    res.json({ ok: true, username: user.username });
  });

  app.post('/api/admin/logout', admin, async (req, res) => {
    await store.deleteSession(req.adminToken);
    res.setHeader('Set-Cookie', clearCookieHeader());
    res.json({ ok: true });
  });

  app.get('/api/admin/me', admin, (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/admin/stats', admin, async (_req, res) => {
    res.json(await store.stats());
  });

  app.get('/api/admin/orders', admin, async (_req, res) => {
    res.json(await store.listOrders());
  });

  app.patch('/api/admin/orders/:id', admin, async (req, res) => {
    const status = clampText(req.body?.status, 40);
    if (!statusLib.ALLOWED.includes(status)) {
      res.status(400).json({ error: 'Недопустимый статус заказа' });
      return;
    }
    const changes = await store.updateOrderStatus(Number(req.params.id), status);
    if (!changes) {
      res.status(404).json({ error: 'Заказ не найден' });
      return;
    }
    const order = await store.getOrder(Number(req.params.id));
    if (order?.telegram_user_id && bot?.notifyCustomer) {
      await bot.notifyCustomer(order);
    }
    res.json({ ok: true, status });
  });

  app.get('/api/admin/reservations', admin, async (_req, res) => {
    res.json(await store.listReservations());
  });

  app.patch('/api/admin/reservations/:id', admin, async (req, res) => {
    const allowed = ['pending', 'confirmed', 'cancelled', 'completed'];
    const status = clampText(req.body?.status, 20);
    if (!allowed.includes(status)) {
      res.status(400).json({ error: 'Недопустимый статус брони' });
      return;
    }
    const changes = await store.updateReservationStatus(Number(req.params.id), status);
    if (!changes) {
      res.status(404).json({ error: 'Бронь не найдена' });
      return;
    }
    res.json({ ok: true, status });
  });

  app.get('/api/admin/guests', admin, async (_req, res) => {
    res.json(await store.listGuests());
  });

  app.get('/api/admin/reviews', admin, async (_req, res) => {
    res.json(await store.listReviews(true));
  });

  app.patch('/api/admin/reviews/:id', admin, async (req, res) => {
    const allowed = ['pending', 'approved', 'hidden'];
    const status = clampText(req.body?.status, 20);
    if (!allowed.includes(status)) {
      res.status(400).json({ error: 'Недопустимый статус отзыва' });
      return;
    }
    const changes = await store.updateReviewStatus(Number(req.params.id), status);
    if (!changes) {
      res.status(404).json({ error: 'Отзыв не найден' });
      return;
    }
    res.json({ ok: true, status });
  });

  app.get('/api/admin/dishes', admin, async (_req, res) => {
    res.json(await store.listDishes(false));
  });

  app.patch('/api/admin/dishes/:id', admin, async (req, res) => {
    const existing = await store.getDish(req.params.id, false);
    if (!existing) {
      res.status(404).json({ error: 'Блюдо не найдено' });
      return;
    }
    if (req.body?.price !== undefined) {
      const price = Number(req.body.price);
      if (!Number.isInteger(price) || price < 1 || price > 10000) {
        res.status(400).json({ error: 'Цена должна быть от 1 до 10000' });
        return;
      }
    }
    const updated = await store.updateDish(req.params.id, {
      available: req.body?.available,
      price: req.body?.price
    });
    res.json(updated);
  });

  app.get('/favicon.ico', (_req, res) => {
    res.redirect(301, '/favicon.svg');
  });

  mountTelegramRoutes(app, store, bot, { writeLimit, isName, isPhone, clampText });
  mountPaymentRoutes(app, store, bot);

  app.use(express.static(ROOT, {
    index: 'index.html',
    extensions: ['html'],
    setHeaders(res, filePath) {
      if (/\.(js|css)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));

  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
      res.status(400).json({ error: 'Некорректный JSON' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  });

  app.listen(PORT, () => {
    console.log(`PLOV TG: http://localhost:${PORT}`);
    console.log(`Админка: http://localhost:${PORT}/admin.html`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
