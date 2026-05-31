-- ============================================================
-- Eat&fit Telegram Bot — PostgreSQL schema
-- ============================================================

-- Клиенты
CREATE TABLE IF NOT EXISTS clients (
  id          SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  first_name  VARCHAR(100),
  last_name   VARCHAR(100),
  phone       VARCHAR(20),
  address     TEXT,
  language    VARCHAR(5)     DEFAULT 'ru',     -- 'ru' или 'uz'
  balance     NUMERIC(10, 2) DEFAULT 0,        -- депозит/предоплата
  role        VARCHAR(20)    DEFAULT 'client', -- 'client' | 'admin' | 'cook' | 'courier'
  created_at  TIMESTAMP      DEFAULT NOW()
);

-- Меню
CREATE TABLE IF NOT EXISTS menu_items (
  id             SERIAL PRIMARY KEY,
  name_ru        VARCHAR(200),
  name_uz        VARCHAR(200),
  description_ru TEXT,
  description_uz TEXT,
  category       VARCHAR(50),                  -- 'main' | 'drink' | 'dessert'
  price          NUMERIC(10, 2),
  photo_url      TEXT,
  is_active      BOOLEAN   DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT NOW()
);

-- Заказы
CREATE TABLE IF NOT EXISTS orders (
  id                SERIAL PRIMARY KEY,
  client_id         INTEGER REFERENCES clients(id),
  status            VARCHAR(30)    DEFAULT 'pending',
  -- статусы: pending | confirmed | cooking | delivering | done | cancelled
  total_amount      NUMERIC(10, 2),
  paid_from_balance NUMERIC(10, 2) DEFAULT 0,
  delivery_address  TEXT,
  comment           TEXT,
  cook_id           BIGINT,                     -- telegram_id повара, взявшего заказ
  courier_id        BIGINT,                     -- telegram_id курьера, взявшего заказ
  created_at        TIMESTAMP      DEFAULT NOW(),
  updated_at        TIMESTAMP      DEFAULT NOW()
);

-- Позиции заказа
CREATE TABLE IF NOT EXISTS order_items (
  id             SERIAL PRIMARY KEY,
  order_id       INTEGER REFERENCES orders(id),
  menu_item_id   INTEGER REFERENCES menu_items(id),
  quantity       INTEGER,
  price_at_order NUMERIC(10, 2)
);

-- Депозиты (история пополнений)
CREATE TABLE IF NOT EXISTS deposits (
  id         SERIAL PRIMARY KEY,
  client_id  INTEGER REFERENCES clients(id),
  amount     NUMERIC(10, 2),
  note       TEXT,
  created_by BIGINT,                            -- telegram_id админа который пополнил
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для частых выборок
CREATE INDEX IF NOT EXISTS idx_orders_client  ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_category  ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_deposits_client ON deposits(client_id);
