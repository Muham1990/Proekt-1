CREATE TABLE IF NOT EXISTS dishes (
  id TEXT PRIMARY KEY,
  cat TEXT NOT NULL,
  angle DOUBLE PRECISION DEFAULT 0,
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
  available BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS guests (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE guests ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS email_codes (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  guests INTEGER NOT NULL,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  dish_id TEXT NOT NULL,
  name_snapshot TEXT NOT NULL,
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  rating INTEGER NOT NULL,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS reward_claims (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  order_id INTEGER REFERENCES orders(id),
  reward_id TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  cart_total INTEGER NOT NULL,
  cart_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'won',
  telegram_user_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reward_claims ADD COLUMN IF NOT EXISTS telegram_user_id TEXT;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'web';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment TEXT NOT NULL DEFAULT 'delivery';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS telegram_user_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lat TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lng TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS apartment TEXT;

CREATE TABLE IF NOT EXISTS telegram_customers (
  telegram_user_id TEXT PRIMARY KEY,
  chat_id TEXT,
  name TEXT,
  username TEXT,
  phone TEXT,
  session_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
