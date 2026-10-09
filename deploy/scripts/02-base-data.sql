-- =========================================================
-- 02-base-data.sql
-- Базовые данные: дефолтный админ
-- Пароль: "admin" (bcrypt, cost=10) — ОБЯЗАТЕЛЬНО сменить!
-- =========================================================

INSERT INTO admins (login, password_hash)
VALUES (
  'admin',
  '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FbPGUMi7LtE5kM3/2pLOhuJbYa7K8tW'
)
ON CONFLICT (login) DO NOTHING;
