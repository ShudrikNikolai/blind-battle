-- =========================================================
-- 03-quize-data.sql
-- Демо-квизы для локальной разработки
-- =========================================================

INSERT INTO quizzes (title, content, is_published, admin_id)
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
  (SELECT id FROM admins WHERE login = 'admin' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE title = 'Основы TypeScript');

INSERT INTO quizzes (title, content, is_published, admin_id)
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
  (SELECT id FROM admins WHERE login = 'admin' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM quizzes WHERE title = 'Postgres для разработчика');
