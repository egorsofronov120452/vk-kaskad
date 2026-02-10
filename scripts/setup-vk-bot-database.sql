-- VK Delivery Bot Database Schema

-- Пользователи (клиенты)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  vk_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  role TEXT DEFAULT 'client',
  blacklisted_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Сотрудники
CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  vk_id BIGINT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  role TEXT NOT NULL, -- intern, courier, senior, management
  created_at TIMESTAMP DEFAULT NOW()
);

-- Чаты (автоопределяемые)
CREATE TABLE IF NOT EXISTS chats (
  id BIGSERIAL PRIMARY KEY,
  peer_id BIGINT UNIQUE NOT NULL,
  chat_type TEXT NOT NULL, -- training, flood, dispatch, board, management, senior, activity
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Категории товаров
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Товары
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  cost_price INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Корзины
CREATE TABLE IF NOT EXISTS cart (
  id BIGSERIAL PRIMARY KEY,
  user_vk_id BIGINT NOT NULL,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_vk_id, product_id)
);

-- Состояния пользователей (для диалогов)
CREATE TABLE IF NOT EXISTS user_states (
  vk_id BIGINT PRIMARY KEY,
  state TEXT,
  data JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Заказы
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  client_vk_id BIGINT NOT NULL,
  client_username TEXT,
  delivery_location TEXT NOT NULL,
  total_price INTEGER NOT NULL,
  total_cost INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, preparing, delivering, completed, cancelled
  courier_vk_id BIGINT,
  courier_username TEXT,
  estimated_time TEXT,
  accepted_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Товары в заказах
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_price INTEGER NOT NULL,
  product_cost_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Онлайн активность
CREATE TABLE IF NOT EXISTS online_activity (
  id BIGSERIAL PRIMARY KEY,
  vk_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  status TEXT DEFAULT 'offline', -- online, offline, afk
  last_activity TIMESTAMP DEFAULT NOW(),
  online_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Дневная статистика
CREATE TABLE IF NOT EXISTS daily_stats (
  id BIGSERIAL PRIMARY KEY,
  vk_id BIGINT NOT NULL,
  username TEXT,
  date DATE DEFAULT CURRENT_DATE,
  online_minutes INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  orders_accepted INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(vk_id, date)
);

-- Финансовые отчеты
CREATE TABLE IF NOT EXISTS financial_reports (
  id BIGSERIAL PRIMARY KEY,
  report_type TEXT NOT NULL, -- daily, weekly
  report_date DATE NOT NULL,
  total_income INTEGER DEFAULT 0,
  total_cost INTEGER DEFAULT 0,
  commission INTEGER DEFAULT 0,
  net_profit INTEGER DEFAULT 0,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_users_vk_id ON users(vk_id);
CREATE INDEX IF NOT EXISTS idx_employees_vk_id ON employees(vk_id);
CREATE INDEX IF NOT EXISTS idx_chats_peer_id ON chats(peer_id);
CREATE INDEX IF NOT EXISTS idx_chats_type ON chats(chat_type);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON orders(courier_vk_id);
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_vk_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_vk_id);
CREATE INDEX IF NOT EXISTS idx_online_vk_id ON online_activity(vk_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);

-- Примеры данных для тестирования (опционально)
INSERT INTO categories (name, description) VALUES
  ('Основные блюда', 'Горячие блюда и основное меню'),
  ('Напитки', 'Холодные и горячие напитки'),
  ('Десерты', 'Сладости и выпечка')
ON CONFLICT DO NOTHING;
