'use strict';

const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createStore } = require('./store');
const { sendWelcomeEmail } = require('./email');
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

async function main() {
  loadEnv();
  const store = await createStore();
  const PORT = Number(process.env.PORT) || 3000;
  const ROOT = path.join(__dirname, '..');
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  app.use(express.json({ limit: '32kb' }));

  app.use('/vendor/three', express.static(path.join(ROOT, 'node_modules/three')));
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
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
    });
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      name: 'PLOV TG API',
      db: store.driver,
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

  app.post('/api/guests', writeLimit, async (req, res) => {
    const name = clampText(req.body?.name, 80);
    const email = clampText(req.body?.email, 120).toLowerCase();
    if (!isName(name) || !isEmail(email)) {
      res.status(400).json({ error: 'Укажите имя и корректный email' });
      return;
    }
    try {
      const existing = await store.findGuest(email);
      if (existing) {
        res.json({ guest: existing, returning: true, emailSent: false });
        return;
      }
      const guest = await store.createGuest(name, email);
      const mail = await sendWelcomeEmail(name, email);
      res.status(201).json({ guest, returning: false, emailSent: mail.sent, emailVia: mail.via });
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

    const orderNumber = await store.nextOrderNumber();
    const orderId = await store.createOrder({
      orderNumber, name, phone, email, address, date, time, comment: comment || null, total
    }, prepared);
    res.status(201).json({
      id: orderId,
      orderNumber,
      total,
      status: 'new',
      message: 'Заказ принят и передан на кухню.'
    });
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
    const allowed = ['new', 'preparing', 'delivering', 'done', 'cancelled'];
    const status = clampText(req.body?.status, 20);
    if (!allowed.includes(status)) {
      res.status(400).json({ error: 'Недопустимый статус заказа' });
      return;
    }
    const changes = await store.updateOrderStatus(Number(req.params.id), status);
    if (!changes) {
      res.status(404).json({ error: 'Заказ не найден' });
      return;
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

  app.use(express.static(ROOT, {
    index: 'index.html',
    extensions: ['html']
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
