-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  vk_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  role TEXT DEFAULT 'client', -- client, trainee, courier, senior, management
  blacklisted_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица категорий товаров
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  photo_url TEXT,
  parent_id INTEGER REFERENCES categories(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица товаров
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nutrition TEXT, -- питательность, например "80ос"
  price INTEGER NOT NULL, -- в рублях
  cost_price INTEGER NOT NULL, -- себестоимость
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  client_vk_id BIGINT NOT NULL,
  client_username TEXT,
  delivery_location TEXT NOT NULL,
  total_price INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, preparing, delivering, completed, cancelled
  courier_vk_id BIGINT,
  courier_username TEXT,
  estimated_time TEXT,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Таблица элементов заказа
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_nutrition TEXT,
  product_price INTEGER NOT NULL,
  product_cost_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица корзин (временное хранение)
CREATE TABLE IF NOT EXISTS carts (
  id SERIAL PRIMARY KEY,
  user_vk_id BIGINT NOT NULL,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_vk_id, product_id)
);

-- Таблица состояния пользователя (для навигации)
CREATE TABLE IF NOT EXISTS user_states (
  vk_id BIGINT PRIMARY KEY,
  state TEXT DEFAULT 'main_menu',
  data JSONB DEFAULT '{}',
  message_id INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица чатов
CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  vk_peer_id BIGINT UNIQUE NOT NULL,
  chat_type TEXT NOT NULL, -- training, flood, dispatch, board, management, senior, activity
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица онлайн активности
CREATE TABLE IF NOT EXISTS online_activity (
  id SERIAL PRIMARY KEY,
  vk_id BIGINT NOT NULL,
  username TEXT,
  status TEXT DEFAULT 'offline', -- online, afk, offline
  last_activity TIMESTAMP DEFAULT NOW(),
  online_duration INTEGER DEFAULT 0, -- в секундах за сегодня
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица ежедневной статистики
CREATE TABLE IF NOT EXISTS daily_stats (
  id SERIAL PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  vk_id BIGINT NOT NULL,
  username TEXT,
  online_minutes INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  orders_accepted INTEGER DEFAULT 0,
  UNIQUE(date, vk_id)
);

-- Таблица недельной статистики по зарплатам
CREATE TABLE IF NOT EXISTS weekly_salary (
  id SERIAL PRIMARY KEY,
  week_start DATE NOT NULL,
  courier_vk_id BIGINT NOT NULL,
  courier_username TEXT,
  total_salary INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица финансовых отчетов
CREATE TABLE IF NOT EXISTS financial_reports (
  id SERIAL PRIMARY KEY,
  report_type TEXT NOT NULL, -- daily, weekly
  report_date DATE NOT NULL,
  total_income INTEGER DEFAULT 0,
  total_cost INTEGER DEFAULT 0,
  commission INTEGER DEFAULT 0,
  net_profit INTEGER DEFAULT 0,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица настроек
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Вставка начальных настроек
INSERT INTO settings (key, value) VALUES 
  ('commission_percent', '10'),
  ('courier_salary_percent', '40'),
  ('organization_percent', '10')
ON CONFLICT (key) DO NOTHING;

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_users_vk_id ON users(vk_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_courier ON orders(courier_vk_id);
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_vk_id);
CREATE INDEX IF NOT EXISTS idx_carts_user ON carts(user_vk_id);
CREATE INDEX IF NOT EXISTS idx_online_activity_vk_id ON online_activity(vk_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_daily_stats_vk_id ON daily_stats(vk_id);
