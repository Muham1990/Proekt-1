'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { hashPassword } = require('./auth');
const { DISHES, REVIEWS } = require('./seed-data');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'plovtg.db');

function openDatabase() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  migrate(db);
  seedIfEmpty(db);
  refreshDishImages(db);
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS dishes (
      id TEXT PRIMARY KEY,
      cat TEXT NOT NULL,
      angle REAL DEFAULT 0,
      name_ru TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_tj TEXT NOT NULL,
      desc_ru TEXT NOT NULL,
      desc_en TEXT NOT NULL,
      desc_tj TEXT NOT NULL,
      ingredients_ru TEXT,
      ingredients_en TEXT,
      ingredients_tj TEXT,
      history_ru TEXT,
      history_en TEXT,
      history_tj TEXT,
      price INTEGER NOT NULL,
      cal INTEGER,
      img TEXT,
      icon TEXT,
      available INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS email_codes (
      email TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      guests INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      comment TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      comment TEXT,
      total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      dish_id TEXT NOT NULL,
      name_snapshot TEXT NOT NULL,
      price INTEGER NOT NULL,
      qty INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      text TEXT NOT NULL,
      rating INTEGER NOT NULL,
      city TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reward_claims (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL UNIQUE,
      order_id INTEGER,
      reward_id TEXT NOT NULL,
      reward_name TEXT NOT NULL,
      cart_total INTEGER NOT NULL,
      cart_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'won',
      telegram_user_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS telegram_customers (
      telegram_user_id TEXT PRIMARY KEY,
      chat_id TEXT,
      name TEXT,
      username TEXT,
      phone TEXT,
      session_id TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  try { db.exec('ALTER TABLE guests ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0'); } catch { /* already exists */ }
  const extraCols = [
    "ALTER TABLE orders ADD COLUMN channel TEXT NOT NULL DEFAULT 'web'",
    "ALTER TABLE orders ADD COLUMN fulfillment TEXT NOT NULL DEFAULT 'delivery'",
    "ALTER TABLE orders ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'cash'",
    'ALTER TABLE orders ADD COLUMN telegram_user_id TEXT',
    'ALTER TABLE orders ADD COLUMN lat TEXT',
    'ALTER TABLE orders ADD COLUMN lng TEXT',
    'ALTER TABLE orders ADD COLUMN apartment TEXT',
    'ALTER TABLE orders ADD COLUMN receipt_file_id TEXT',
    'ALTER TABLE reward_claims ADD COLUMN telegram_user_id TEXT'
  ];
  for (const stmt of extraCols) {
    try { db.exec(stmt); } catch { /* already exists */ }
  }
}

function seedIfEmpty(db) {
  upsertDishes(db);

  const reviewCount = db.prepare('SELECT COUNT(*) AS n FROM reviews').get().n;
  if (reviewCount === 0) {
    const insertReview = db.prepare(`
      INSERT INTO reviews (name, text, rating, city, status) VALUES (?, ?, ?, ?, 'approved')
    `);
    REVIEWS.forEach((r) => insertReview.run(r.name, r.text, r.rating, r.city));
  }

  const adminCount = db.prepare('SELECT COUNT(*) AS n FROM admin_users').get().n;
  if (adminCount === 0) {
    const password = process.env.ADMIN_PASSWORD || 'plovtg2026';
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(
      process.env.ADMIN_USER || 'admin',
      hashPassword(password)
    );
  }
}

function upsertDishes(db) {
  const stmt = db.prepare(`
    INSERT INTO dishes (
      id, cat, angle, name_ru, name_en, name_tj,
      desc_ru, desc_en, desc_tj,
      ingredients_ru, ingredients_en, ingredients_tj,
      history_ru, history_en, history_tj,
      price, cal, img, icon, available, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    ON CONFLICT(id) DO UPDATE SET
      cat=excluded.cat,
      angle=excluded.angle,
      name_ru=excluded.name_ru,
      name_en=excluded.name_en,
      name_tj=excluded.name_tj,
      desc_ru=excluded.desc_ru,
      desc_en=excluded.desc_en,
      desc_tj=excluded.desc_tj,
      ingredients_ru=excluded.ingredients_ru,
      ingredients_en=excluded.ingredients_en,
      ingredients_tj=excluded.ingredients_tj,
      history_ru=excluded.history_ru,
      history_en=excluded.history_en,
      history_tj=excluded.history_tj,
      price=excluded.price,
      cal=excluded.cal,
      img=excluded.img,
      icon=excluded.icon,
      sort_order=excluded.sort_order
  `);
  const tx = db.transaction(() => {
    DISHES.forEach((d, i) => {
      stmt.run(
        d.id, d.cat, d.angle,
        d.name.ru, d.name.en, d.name.tj,
        d.desc.ru, d.desc.en, d.desc.tj,
        d.ingredients.ru, d.ingredients.en, d.ingredients.tj,
        d.history.ru, d.history.en, d.history.tj,
        d.price, d.cal, d.img, d.icon || null, i
      );
    });
  });
  tx();
}

function refreshDishImages(db) {
  upsertDishes(db);
}

function mapDish(row) {
  return {
    id: row.id,
    cat: row.cat,
    angle: row.angle,
    name: { ru: row.name_ru, en: row.name_en, tj: row.name_tj },
    desc: { ru: row.desc_ru, en: row.desc_en, tj: row.desc_tj },
    ingredients: {
      ru: row.ingredients_ru,
      en: row.ingredients_en,
      tj: row.ingredients_tj
    },
    history: {
      ru: row.history_ru,
      en: row.history_en,
      tj: row.history_tj
    },
    price: row.price,
    cal: row.cal,
    img: row.img,
    icon: row.icon,
    available: Boolean(row.available)
  };
}

module.exports = { openDatabase, mapDish, DB_PATH };
