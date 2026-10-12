# Quizzle Admin

Админ-панель для управления квизами. Фронтенд на SvelteKit, бэкенд на NestJS, авторизация через cookie-сессию (`express-session`).

## Стек

- SvelteKit 2 + Svelte 5 (runes), TypeScript
- `@sveltejs/adapter-node`
- Docker (multi-stage)

## Возможности

- Вход по логину и паролю, выход
- Список квизов с пагинацией, публикация и снятие с публикации
- Создание и редактирование квиза (вопросы, варианты ответов, лимит времени)
- Смена пароля, создание нового админа

## Быстрый старт

Нужен Node.js 22+ и запущенный бэкенд.

```bash
cp .env.example .env
npm ci
npm run dev
```

Приложение откроется на http://localhost:5173.

| Команда           | Что делает                    |
| ----------------- | ----------------------------- |
| `npm run dev`     | dev-сервер                    |
| `npm run build`   | production-сборка в `build/`  |
| `npm start`       | запуск собранного приложения  |
| `npm run check`   | проверка типов (svelte-check) |

## Переменные окружения

Читаются на сервере во время старта (`$env/dynamic/private`), в браузер не попадают.

| Переменная            | По умолчанию            | Описание                                       |
| --------------------- | ----------------------- | ---------------------------------------------- |
| `API_URL`             | `http://localhost:3000` | Адрес NestJS-бэкенда                           |
| `API_PREFIX`          | `/api/v1`               | Глобальный префикс бэкенда                     |
| `SESSION_COOKIE_NAME` | `connect.sid`           | Имя куки `express-session`                     |
| `ORIGIN`              | не задан                | Публичный адрес фронта (обязателен в проде)    |

## Как устроена авторизация

Браузер общается только со SvelteKit, на бэкенд ходит его сервер. Поэтому CORS не нужен.

1. Форма логина отправляется в form action `/login`, оттуда запрос идёт на `POST /admin/login`.
2. `Set-Cookie` из ответа бэкенда пробрасывается в браузер (`src/lib/server/cookies.ts`).
3. На каждый запрос `src/hooks.server.ts` вызывает `GET /admin/me` с куками пользователя. Нет сессии: редирект на `/login`. Есть сессия на `/login`: редирект на `/dashboard`.
4. Любой 401 от бэкенда стирает куку и ведёт на `/login`.
5. Выход: `POST /logout` гасит сессию на бэкенде (`POST /admin/logout`) и удаляет куку.

## Эндпоинты бэкенда

Все пути указаны относительно `API_PREFIX`. Ответы ожидаются в формате `IApiResponse` (см. `src/lib/types/api.ts`).

| Метод | Путь                  | Назначение                |
| ----- | --------------------- | ------------------------- |
| POST  | `/admin/login`        | вход (`{login, password}`) |
| POST  | `/admin/logout`       | выход                     |
| GET   | `/admin/me`           | текущий админ             |
| PATCH | `/admin/upd-pass`     | смена пароля              |
| POST  | `/admin/new-admin`    | создание админа           |
| GET   | `/quiz/all`           | список квизов (`page`, `limit`) |
| GET   | `/quiz/:id`           | один квиз                 |
| POST  | `/quiz`               | создание квиза            |
| PATCH | `/quiz/:id`           | обновление квиза          |
| PATCH | `/quiz/:id/publish`   | публикация (`{isPublished}`) |

## Структура

```
src/
├── hooks.server.ts            # проверка сессии и гард роутов
├── lib/
│   ├── components/            # QuizEditor, FormErrors
│   ├── server/                # api-клиент, config, cookies, auth
│   └── types/api.ts           # контракт API и типы Admin/Quiz
└── routes/
    ├── login/                 # публичная страница
    ├── logout/                # POST: выход
    └── (app)/                 # приватная группа
        ├── dashboard/         # список квизов
        ├── quiz/new/          # создание
        ├── quiz/[id]/         # редактирование
        └── settings/          # пароль и новый админ
```

Публичные пути задаются в `PUBLIC_PATHS` в `hooks.server.ts`. Новые приватные страницы кладутся в `src/routes/(app)/`.

## Docker

```bash
docker build -t quizzle-admin .

docker run -d -p 3000:3000 \
  -e API_URL=http://backend:3000 \
  -e API_PREFIX=/api/v1 \
  -e SESSION_COOKIE_NAME=connect.sid \
  -e ORIGIN=https://admin.example.com \
  quizzle-admin
```

## Заметки по продакшену

- **`ORIGIN`** должен точно совпадать с адресом в браузере, включая схему. Без него SvelteKit блокирует POST-формы с ошибкой `Cross-site POST form submissions are forbidden`. Если прокси выставляет заголовки, можно использовать `PROTOCOL_HEADER=x-forwarded-proto` и `HOST_HEADER=x-forwarded-host`.
- **`API_URL`** внутри Docker-сети указывает на сервис бэкенда (`http://backend:3000`), а не на `localhost`.
- Если бэкенд стоит за nginx и использует `cookie.secure: true`, на нём нужен `app.set('trust proxy', 1)`, иначе кука не выставится.
- Сессии хранятся на стороне бэкенда, фронтенд stateless и масштабируется репликами.
