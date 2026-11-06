SET timezone = 'UTC';

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- ENUM-типы ----------
DO $$ BEGIN
  CREATE TYPE game_status_enum AS ENUM ('created', 'active', 'finished');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE game_winner_enum AS ENUM ('author', 'rival', 'draw');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE game_mode_enum AS ENUM ('versus', 'solo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =========================================================
-- admins
-- =========================================================
CREATE TABLE IF NOT EXISTS admins (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  login         varchar     NOT NULL UNIQUE,
  password_hash varchar     NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

-- =========================================================
-- users
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id          bigint      NOT NULL UNIQUE,
  first_name           varchar     NOT NULL,
  user_name            varchar,
  phone_number         varchar,
  is_confirmed         boolean     NOT NULL DEFAULT false,
  pending_invite_token varchar(64),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz
);

-- =========================================================
-- tags (один тег -> много квизов)
-- =========================================================
CREATE TABLE IF NOT EXISTS tags (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         varchar(64) NOT NULL,
  is_published boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

-- Имя уникально среди неудалённых тегов; удалённое имя можно переиспользовать.
CREATE UNIQUE INDEX IF NOT EXISTS uq_tags_name_active
  ON tags (lower(name)) WHERE deleted_at IS NULL;

-- =========================================================
-- quizzes
-- =========================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         varchar     NOT NULL,
  content       jsonb       NOT NULL,
  is_published  boolean     NOT NULL DEFAULT false,
  admin_id      uuid        NOT NULL,
  tag_id        uuid        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,
  CONSTRAINT fk_quizzes_admin
    FOREIGN KEY (admin_id) REFERENCES admins(id)
    ON DELETE RESTRICT,
  CONSTRAINT fk_quizzes_tag
    FOREIGN KEY (tag_id) REFERENCES tags(id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_quizzes_admin_id  ON quizzes(admin_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_tag_id    ON quizzes(tag_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_published ON quizzes(is_published) WHERE deleted_at IS NULL;

-- =========================================================
-- games
-- =========================================================
CREATE TABLE IF NOT EXISTS games (
  id             uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_token   varchar          NOT NULL UNIQUE,
  mode           game_mode_enum   NOT NULL DEFAULT 'versus',
  status         game_status_enum NOT NULL DEFAULT 'created',
  author_id      uuid             NOT NULL,
  rival_id       uuid,
  quiz_id        uuid             NOT NULL,
  quiz           jsonb            NOT NULL,  -- снимок квиза на момент старта игры
  deadline_at    timestamptz,
  author_answers int[]            NOT NULL DEFAULT '{}',
  rival_answers  int[]            NOT NULL DEFAULT '{}',
  author_score   int,
  rival_score    int,
  winner         game_winner_enum,
  created_at     timestamptz      NOT NULL DEFAULT now(),
  updated_at     timestamptz      NOT NULL DEFAULT now(),
  deleted_at     timestamptz,
  CONSTRAINT fk_games_author
    FOREIGN KEY (author_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_games_rival
    FOREIGN KEY (rival_id)  REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT chk_games_winner
    CHECK (mode = 'solo' OR ((status = 'finished') = (winner IS NOT NULL))),
  CONSTRAINT chk_games_solo
    CHECK (mode = 'versus' OR (rival_id IS NULL AND status <> 'created' AND winner IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_games_status_deadline
  ON games(status, deadline_at);

CREATE INDEX IF NOT EXISTS idx_games_author_id ON games(author_id);
CREATE INDEX IF NOT EXISTS idx_games_rival_id  ON games(rival_id);

-- Для cron-очистки брошенных дуэлей (status='created', старый created_at).
CREATE INDEX IF NOT EXISTS idx_games_created_created_at
  ON games(created_at) WHERE status = 'created';

-- =========================================================
-- notifications
-- =========================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  text       text        NOT NULL,
  is_send    boolean     NOT NULL DEFAULT false,
  user_id    uuid        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_is_send
  ON notifications(is_send);

CREATE INDEX IF NOT EXISTS idx_notifications_pending
  ON notifications(user_id) WHERE is_send = false;

-- =========================================================
-- statistic_games
-- =========================================================
CREATE TABLE IF NOT EXISTS statistic_games (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id        uuid        NOT NULL UNIQUE,
  author_correct boolean[]   NOT NULL DEFAULT '{}',
  rival_correct  boolean[]   NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz,
  CONSTRAINT fk_statistic_games_game
    FOREIGN KEY (game_id) REFERENCES games(id)
    ON DELETE CASCADE
);

-- =========================================================
-- statistic_users
-- =========================================================
CREATE TABLE IF NOT EXISTS statistic_users (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL UNIQUE,
  wins       int         NOT NULL DEFAULT 0,
  losses     int         NOT NULL DEFAULT 0,
  draws      int         NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT fk_statistic_users_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- =========================================================
-- updated_at: функция и триггеры
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'admins', 'users', 'tags', 'quizzes', 'games',
    'notifications', 'statistic_games', 'statistic_users'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON %1$s;
       CREATE TRIGGER trg_%1$s_updated_at
       BEFORE UPDATE ON %1$s
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t
    );
  END LOOP;
END $$;

-- =========================================================
-- Базовые данные
-- =========================================================

-- Технический владелец демо-квизов. Логин "seed-admin" не предназначен
-- для входа: пароль — случайное значение, которое нигде не хранится.
INSERT INTO admins (login, password_hash)
VALUES (
  'seed-admin',
  '$argon2id$v=19$m=65536,p=4,t=3$ohLY+FE8BGFRXRvfPjgoCQ$i8cwVMa9FSfc2rWjmGWGVv1ZATUPFBXAQ733+qHkDBs'
)
ON CONFLICT (login) DO NOTHING;

INSERT INTO tags (name, is_published)
SELECT v.name, true
FROM (VALUES ('Без темы'), ('Программирование'), ('Математика')) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM tags t
  WHERE lower(t.name) = lower(v.name) AND t.deleted_at IS NULL
);

-- =========================================================
-- Демо-квизы (локальная разработка)
-- =========================================================
INSERT INTO quizzes (title, content, is_published, admin_id, tag_id)
SELECT
  'Основы TypeScript',
  '{
    "timeLimitSec": 90,
    "questions": [
      {
        "question": "Какой тип у литерала null в strict-режиме?",
        "buttons": [
          { "text": "any",     "isCorrectAnswer": false },
          { "text": "null",    "isCorrectAnswer": true  },
          { "text": "void",    "isCorrectAnswer": false },
          { "text": "unknown", "isCorrectAnswer": false }
        ]
      },
      {
        "question": "Что делает оператор as?",
        "buttons": [
          { "text": "Преобразует значение во время выполнения", "isCorrectAnswer": false },
          { "text": "Указывает компилятору трактовать тип",     "isCorrectAnswer": true  },
          { "text": "Создаёт новый объект",                     "isCorrectAnswer": false }
        ]
      },
      {
        "question": "Какой модификатор делает поле доступным только внутри класса?",
        "buttons": [
          { "text": "public",    "isCorrectAnswer": false },
          { "text": "protected", "isCorrectAnswer": false },
          { "text": "private",   "isCorrectAnswer": true  },
          { "text": "readonly",  "isCorrectAnswer": false }
        ]
      }
    ]
  }'::jsonb,
  true,
  (SELECT id FROM admins WHERE login = 'seed-admin' LIMIT 1),
  (SELECT id FROM tags WHERE lower(name) = lower('Программирование') AND deleted_at IS NULL LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE title = 'Основы TypeScript');

INSERT INTO quizzes (title, content, is_published, admin_id, tag_id)
SELECT
  'Postgres для разработчика',
  '{
    "timeLimitSec": 90,
    "questions": [
      {
        "question": "Какой тип хранит JSON в бинарном виде?",
        "buttons": [
          { "text": "json",  "isCorrectAnswer": false },
          { "text": "jsonb", "isCorrectAnswer": true  },
          { "text": "text",  "isCorrectAnswer": false }
        ]
      },
      {
        "question": "Что делает VACUUM?",
        "buttons": [
          { "text": "Удаляет таблицу",              "isCorrectAnswer": false },
          { "text": "Освобождает мёртвые строки",   "isCorrectAnswer": true  },
          { "text": "Создаёт индекс",               "isCorrectAnswer": false },
          { "text": "Блокирует таблицу на запись",  "isCorrectAnswer": false }
        ]
      },
      {
        "question": "Какой уровень изоляции по умолчанию в Postgres?",
        "buttons": [
          { "text": "Read Uncommitted", "isCorrectAnswer": false },
          { "text": "Read Committed",   "isCorrectAnswer": true  },
          { "text": "Repeatable Read",  "isCorrectAnswer": false },
          { "text": "Serializable",     "isCorrectAnswer": false }
        ]
      }
    ]
  }'::jsonb,
  true,
  (SELECT id FROM admins WHERE login = 'seed-admin' LIMIT 1),
  (SELECT id FROM tags WHERE lower(name) = lower('Программирование') AND deleted_at IS NULL LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE title = 'Postgres для разработчика');
