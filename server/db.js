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
  `);
}

function seedIfEmpty(db) {
  const dishCount = db.prepare('SELECT COUNT(*) AS n FROM dishes').get().n;
  if (dishCount === 0) {
    const insert = db.prepare(`
      INSERT INTO dishes (
        id, cat, angle, name_ru, name_en, name_tj,
        desc_ru, desc_en, desc_tj,
        ingredients_ru, ingredients_en, ingredients_tj,
        history_ru, history_en, history_tj,
        price, cal, img, icon, available, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    DISHES.forEach((d, i) => {
      insert.run(
        d.id, d.cat, d.angle,
        d.name.ru, d.name.en, d.name.tj,
        d.desc.ru, d.desc.en, d.desc.tj,
        d.ingredients.ru, d.ingredients.en, d.ingredients.tj,
        d.history.ru, d.history.en, d.history.tj,
        d.price, d.cal, d.img, d.icon || null, i
      );
    });
  }

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

function refreshDishImages(db) {
  const upd = db.prepare('UPDATE dishes SET img = ? WHERE id = ?');
  DISHES.forEach((d) => upd.run(d.img, d.id));
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
