-- =========================================================
-- 01-init.sql
-- Инициализация схемы БД для blind-battle
-- Выполняется автоматически при первом старте контейнера postgres
-- через /docker-entrypoint-initdb.d
-- =========================================================
SET timezone = 'UTC';

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- ENUM-типы ----------
DO $$ BEGIN
  CREATE TYPE game_status_enum AS ENUM ('created', 'active', 'finished');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE game_winner_enum AS ENUM ('author', 'rival', 'draw');
EXCEPTION
  WHEN duplicate_object THEN NULL;
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
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id   bigint      NOT NULL UNIQUE,
  first_name    varchar     NOT NULL,
  user_name     varchar,
  phone_number  varchar,
  is_confirmed  boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

-- =========================================================
-- quizzes
-- =========================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         varchar     NOT NULL,
  content       jsonb       NOT NULL,
  is_published  boolean     NOT NULL DEFAULT false,
  admin_id      uuid        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,
  CONSTRAINT fk_quizzes_admin
    FOREIGN KEY (admin_id) REFERENCES admins(id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_quizzes_admin_id ON quizzes(admin_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_published ON quizzes(is_published) WHERE deleted_at IS NULL;

-- =========================================================
-- games
-- =========================================================
CREATE TABLE IF NOT EXISTS games (
  id             uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_token   varchar          NOT NULL UNIQUE,
  status         game_status_enum NOT NULL DEFAULT 'created',
  author_id      uuid             NOT NULL,
  rival_id       uuid,
  quiz_id        uuid             NOT NULL,
  quiz           jsonb            NOT NULL,
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
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_games_status_deadline
  ON games(status, deadline_at);

CREATE INDEX IF NOT EXISTS idx_games_author_id ON games(author_id);
CREATE INDEX IF NOT EXISTS idx_games_rival_id  ON games(rival_id);

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
    'admins', 'users', 'quizzes', 'games',
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
