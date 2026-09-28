'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { neon } = require('@neondatabase/serverless');
const { openDatabase, mapDish } = require('./db');
const { hashPassword } = require('./auth');
const { DISHES, REVIEWS } = require('./seed-data');

function sqliteStore(db) {
  return {
    driver: 'sqlite',
    async listDishes(availableOnly) {
      const sql = availableOnly
        ? 'SELECT * FROM dishes WHERE available = 1 ORDER BY sort_order, id'
        : 'SELECT * FROM dishes ORDER BY sort_order, id';
      return db.prepare(sql).all().map(mapDish);
    },
    async getDish(id, availableOnly) {
      const row = availableOnly
        ? db.prepare('SELECT * FROM dishes WHERE id = ? AND available = 1').get(id)
        : db.prepare('SELECT * FROM dishes WHERE id = ?').get(id);
      return row ? mapDish(row) : null;
    },
    async findGuest(email) {
      return db.prepare('SELECT id, name, email FROM guests WHERE email = ?').get(email) || null;
    },
    async createGuest(name, email) {
      const result = db.prepare('INSERT INTO guests (name, email) VALUES (?, ?)').run(name, email);
      return { id: Number(result.lastInsertRowid), name, email };
    },
    async createReservation(data) {
      const result = db.prepare(`
        INSERT INTO reservations (name, phone, guests, date, time, comment)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(data.name, data.phone, data.guests, data.date, data.time, data.comment);
      return Number(result.lastInsertRowid);
    },
    async nextOrderNumber() {
      const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const n = db.prepare('SELECT COUNT(*) AS c FROM orders WHERE order_number LIKE ?').get(`PLOV-${day}-%`).c + 1;
      return `PLOV-${day}-${String(n).padStart(3, '0')}`;
    },
    async createOrder(data, items) {
      const order = db.prepare(`
        INSERT INTO orders (order_number, name, phone, email, address, date, time, comment, total)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(data.orderNumber, data.name, data.phone, data.email, data.address, data.date, data.time, data.comment, data.total);
      const orderId = Number(order.lastInsertRowid);
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, dish_id, name_snapshot, price, qty)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const row of items) insertItem.run(orderId, row.dish_id, row.name_snapshot, row.price, row.qty);
      return orderId;
    },
    async listReviews(status) {
      if (status) return db.prepare('SELECT * FROM reviews ORDER BY datetime(created_at) DESC LIMIT 100').all();
      return db.prepare(`
        SELECT id, name, text, rating, city, created_at
        FROM reviews WHERE status = 'approved'
        ORDER BY datetime(created_at) DESC LIMIT 30
      `).all();
    },
    async createReview(data) {
      db.prepare(`INSERT INTO reviews (name, text, rating, city, status) VALUES (?, ?, ?, ?, 'pending')`)
        .run(data.name, data.text, data.rating, data.city);
    },
    async getAdmin(username) {
      return db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) || null;
    },
    async createSession(token, hours) {
      db.prepare(`INSERT INTO admin_sessions (token, expires_at) VALUES (?, datetime('now', ?))`)
        .run(token, `+${hours} hours`);
    },
    async getSession(token) {
      return db.prepare(`
        SELECT token FROM admin_sessions
        WHERE token = ? AND datetime(expires_at) > datetime('now')
      `).get(token) || null;
    },
    async deleteSession(token) {
      db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
    },
    async stats() {
      return {
        dishes: db.prepare('SELECT COUNT(*) AS n FROM dishes').get().n,
        guests: db.prepare('SELECT COUNT(*) AS n FROM guests').get().n,
        reservations: db.prepare("SELECT COUNT(*) AS n FROM reservations WHERE status = 'pending'").get().n,
        ordersNew: db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'new'").get().n,
        ordersToday: db.prepare("SELECT COUNT(*) AS n FROM orders WHERE date(created_at) = date('now')").get().n,
        revenue: db.prepare("SELECT COALESCE(SUM(total), 0) AS n FROM orders WHERE status != 'cancelled'").get().n,
        reviewsPending: db.prepare("SELECT COUNT(*) AS n FROM reviews WHERE status = 'pending'").get().n
      };
    },
    async listOrders() {
      const orders = db.prepare('SELECT * FROM orders ORDER BY datetime(created_at) DESC LIMIT 100').all();
      const itemsStmt = db.prepare('SELECT dish_id, name_snapshot, price, qty FROM order_items WHERE order_id = ?');
      return orders.map((o) => ({ ...o, items: itemsStmt.all(o.id) }));
    },
    async updateOrderStatus(id, status) {
      return db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id).changes;
    },
    async listReservations() {
      return db.prepare('SELECT * FROM reservations ORDER BY date ASC, time ASC LIMIT 100').all();
    },
    async updateReservationStatus(id, status) {
      return db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, id).changes;
    },
    async listGuests() {
      return db.prepare('SELECT id, name, email, created_at FROM guests ORDER BY id DESC LIMIT 200').all();
    },
    async updateReviewStatus(id, status) {
      return db.prepare('UPDATE reviews SET status = ? WHERE id = ?').run(status, id).changes;
    },
    async updateDish(id, fields) {
      if (fields.available !== undefined) {
        db.prepare('UPDATE dishes SET available = ? WHERE id = ?').run(fields.available ? 1 : 0, id);
      }
      if (fields.price !== undefined) {
        db.prepare('UPDATE dishes SET price = ? WHERE id = ?').run(fields.price, id);
      }
      const row = db.prepare('SELECT * FROM dishes WHERE id = ?').get(id);
      return row ? mapDish(row) : null;
    },
    async findRewardClaimBySession(sessionId) {
      return db.prepare('SELECT * FROM reward_claims WHERE session_id = ?').get(sessionId) || null;
    },
    async findRewardClaimById(id) {
      return db.prepare('SELECT * FROM reward_claims WHERE id = ?').get(id) || null;
    },
    async createRewardClaim(row) {
      db.prepare(`
        INSERT INTO reward_claims (id, session_id, reward_id, reward_name, cart_total, cart_hash, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(row.id, row.sessionId, row.rewardId, row.rewardName, row.cartTotal, row.cartHash, row.status);
      return db.prepare('SELECT * FROM reward_claims WHERE id = ?').get(row.id);
    },
    async attachRewardToOrder({ claimId, sessionId, orderId }) {
      return db.prepare(`
        UPDATE reward_claims
        SET order_id = ?, status = 'claimed'
        WHERE id = ? AND session_id = ? AND order_id IS NULL
      `).run(orderId, claimId, sessionId).changes;
    }
  };
}

function neonStore(sql) {
  return {
    driver: 'neon',
    async listDishes(availableOnly) {
      const rows = availableOnly
        ? await sql`SELECT * FROM dishes WHERE available = TRUE ORDER BY sort_order, id`
        : await sql`SELECT * FROM dishes ORDER BY sort_order, id`;
      return rows.map(mapDish);
    },
    async getDish(id, availableOnly) {
      const rows = availableOnly
        ? await sql`SELECT * FROM dishes WHERE id = ${id} AND available = TRUE`
        : await sql`SELECT * FROM dishes WHERE id = ${id}`;
      return rows[0] ? mapDish(rows[0]) : null;
    },
    async findGuest(email) {
      const rows = await sql`SELECT id, name, email FROM guests WHERE email = ${email}`;
      return rows[0] || null;
    },
    async createGuest(name, email) {
      const rows = await sql`INSERT INTO guests (name, email) VALUES (${name}, ${email}) RETURNING id, name, email`;
      return rows[0];
    },
    async createReservation(data) {
      const rows = await sql`
        INSERT INTO reservations (name, phone, guests, date, time, comment)
        VALUES (${data.name}, ${data.phone}, ${data.guests}, ${data.date}, ${data.time}, ${data.comment})
        RETURNING id
      `;
      return rows[0].id;
    },
    async nextOrderNumber() {
      const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const like = `PLOV-${day}-%`;
      const rows = await sql`SELECT COUNT(*)::int AS c FROM orders WHERE order_number LIKE ${like}`;
      return `PLOV-${day}-${String((rows[0]?.c || 0) + 1).padStart(3, '0')}`;
    },
    async createOrder(data, items) {
      const rows = await sql`
        INSERT INTO orders (order_number, name, phone, email, address, date, time, comment, total)
        VALUES (${data.orderNumber}, ${data.name}, ${data.phone}, ${data.email}, ${data.address}, ${data.date}, ${data.time}, ${data.comment}, ${data.total})
        RETURNING id
      `;
      const orderId = rows[0].id;
      for (const row of items) {
        await sql`
          INSERT INTO order_items (order_id, dish_id, name_snapshot, price, qty)
          VALUES (${orderId}, ${row.dish_id}, ${row.name_snapshot}, ${row.price}, ${row.qty})
        `;
      }
      return orderId;
    },
    async listReviews(all) {
      if (all) return sql`SELECT * FROM reviews ORDER BY created_at DESC LIMIT 100`;
      return sql`
        SELECT id, name, text, rating, city, created_at
        FROM reviews WHERE status = 'approved'
        ORDER BY created_at DESC LIMIT 30
      `;
    },
    async createReview(data) {
      await sql`INSERT INTO reviews (name, text, rating, city, status) VALUES (${data.name}, ${data.text}, ${data.rating}, ${data.city}, 'pending')`;
    },
    async getAdmin(username) {
      const rows = await sql`SELECT * FROM admin_users WHERE username = ${username}`;
      return rows[0] || null;
    },
    async createSession(token, hours) {
      await sql`INSERT INTO admin_sessions (token, expires_at) VALUES (${token}, NOW() + (${hours} || ' hours')::interval)`;
    },
    async getSession(token) {
      const rows = await sql`SELECT token FROM admin_sessions WHERE token = ${token} AND expires_at > NOW()`;
      return rows[0] || null;
    },
    async deleteSession(token) {
      await sql`DELETE FROM admin_sessions WHERE token = ${token}`;
    },
    async stats() {
      const dishes = await sql`SELECT COUNT(*)::int AS n FROM dishes`;
      const guests = await sql`SELECT COUNT(*)::int AS n FROM guests`;
      const reservations = await sql`SELECT COUNT(*)::int AS n FROM reservations WHERE status = 'pending'`;
      const ordersNew = await sql`SELECT COUNT(*)::int AS n FROM orders WHERE status = 'new'`;
      const ordersToday = await sql`SELECT COUNT(*)::int AS n FROM orders WHERE created_at::date = CURRENT_DATE`;
      const revenue = await sql`SELECT COALESCE(SUM(total), 0)::int AS n FROM orders WHERE status != 'cancelled'`;
      const reviewsPending = await sql`SELECT COUNT(*)::int AS n FROM reviews WHERE status = 'pending'`;
      return {
        dishes: dishes[0].n,
        guests: guests[0].n,
        reservations: reservations[0].n,
        ordersNew: ordersNew[0].n,
        ordersToday: ordersToday[0].n,
        revenue: revenue[0].n,
        reviewsPending: reviewsPending[0].n
      };
    },
    async listOrders() {
      const orders = await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 100`;
      const result = [];
      for (const o of orders) {
        const items = await sql`SELECT dish_id, name_snapshot, price, qty FROM order_items WHERE order_id = ${o.id}`;
        result.push({ ...o, items });
      }
      return result;
    },
    async updateOrderStatus(id, status) {
      const rows = await sql`UPDATE orders SET status = ${status} WHERE id = ${id} RETURNING id`;
      return rows.length;
    },
    async listReservations() {
      return sql`SELECT * FROM reservations ORDER BY date ASC, time ASC LIMIT 100`;
    },
    async updateReservationStatus(id, status) {
      const rows = await sql`UPDATE reservations SET status = ${status} WHERE id = ${id} RETURNING id`;
      return rows.length;
    },
    async listGuests() {
      return sql`SELECT id, name, email, created_at FROM guests ORDER BY id DESC LIMIT 200`;
    },
    async updateReviewStatus(id, status) {
      const rows = await sql`UPDATE reviews SET status = ${status} WHERE id = ${id} RETURNING id`;
      return rows.length;
    },
    async updateDish(id, fields) {
      if (fields.available !== undefined) {
        await sql`UPDATE dishes SET available = ${Boolean(fields.available)} WHERE id = ${id}`;
      }
      if (fields.price !== undefined) {
        await sql`UPDATE dishes SET price = ${fields.price} WHERE id = ${id}`;
      }
      const rows = await sql`SELECT * FROM dishes WHERE id = ${id}`;
      return rows[0] ? mapDish(rows[0]) : null;
    },
    async findRewardClaimBySession(sessionId) {
      const rows = await sql`SELECT * FROM reward_claims WHERE session_id = ${sessionId}`;
      return rows[0] || null;
    },
    async findRewardClaimById(id) {
      const rows = await sql`SELECT * FROM reward_claims WHERE id = ${id}`;
      return rows[0] || null;
    },
    async createRewardClaim(row) {
      const rows = await sql`
        INSERT INTO reward_claims (id, session_id, reward_id, reward_name, cart_total, cart_hash, status)
        VALUES (${row.id}, ${row.sessionId}, ${row.rewardId}, ${row.rewardName}, ${row.cartTotal}, ${row.cartHash}, ${row.status})
        RETURNING *
      `;
      return rows[0] || null;
    },
    async attachRewardToOrder({ claimId, sessionId, orderId }) {
      const rows = await sql`
        UPDATE reward_claims
        SET order_id = ${orderId}, status = 'claimed'
        WHERE id = ${claimId} AND session_id = ${sessionId} AND order_id IS NULL
        RETURNING id
      `;
      return rows.length;
    }
  };
}

async function seedNeon(sql) {
  const dishCount = await sql`SELECT COUNT(*)::int AS n FROM dishes`;
  if (dishCount[0].n === 0) {
    for (const [i, d] of DISHES.entries()) {
      await sql`
        INSERT INTO dishes (
          id, cat, angle, name_ru, name_en, name_tj, desc_ru, desc_en, desc_tj,
          ingredients_ru, ingredients_en, ingredients_tj, history_ru, history_en, history_tj,
          price, cal, img, icon, available, sort_order
        ) VALUES (
          ${d.id}, ${d.cat}, ${d.angle}, ${d.name.ru}, ${d.name.en}, ${d.name.tj},
          ${d.desc.ru}, ${d.desc.en}, ${d.desc.tj}, ${d.ingredients.ru}, ${d.ingredients.en}, ${d.ingredients.tj},
          ${d.history.ru}, ${d.history.en}, ${d.history.tj}, ${d.price}, ${d.cal}, ${d.img}, ${d.icon || null}, TRUE, ${i}
        )
      `;
    }
  } else {
    for (const d of DISHES) {
      await sql`UPDATE dishes SET img = ${d.img} WHERE id = ${d.id}`;
    }
  }
  const reviewCount = await sql`SELECT COUNT(*)::int AS n FROM reviews`;
  if (reviewCount[0].n === 0) {
    for (const r of REVIEWS) {
      await sql`INSERT INTO reviews (name, text, rating, city, status) VALUES (${r.name}, ${r.text}, ${r.rating}, ${r.city}, 'approved')`;
    }
  }
  const adminCount = await sql`SELECT COUNT(*)::int AS n FROM admin_users`;
  if (adminCount[0].n === 0) {
    await sql`INSERT INTO admin_users (username, password_hash) VALUES (${process.env.ADMIN_USER || 'admin'}, ${hashPassword(process.env.ADMIN_PASSWORD || 'plovtg2026')})`;
  }
}

async function createStore() {
  if (process.env.DATABASE_URL) {
    const sql = neon(process.env.DATABASE_URL);
    const schema = fs.readFileSync(path.join(__dirname, 'schema.pg.sql'), 'utf8');
    for (const stmt of schema.split(';').map((s) => s.trim()).filter(Boolean)) {
      await sql.query(stmt);
    }
    await seedNeon(sql);
    console.log('База: Neon Postgres');
    return neonStore(sql);
  }
  const db = openDatabase();
  console.log('База: локальный SQLite');
  return sqliteStore(db);
}

module.exports = { createStore };
