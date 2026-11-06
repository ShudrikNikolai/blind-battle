export type TelegramMode = 'polling' | 'webhook';

export const parseTelegramMode = (
  raw = process.env.TELEGRAM_MODE ?? '',
): TelegramMode => {
  const value = raw.trim() || 'polling';
  if (value !== 'polling' && value !== 'webhook') {
    throw new Error(
      `Invalid TELEGRAM_MODE "${value}": expected "polling" or "webhook"`,
    );
  }
  return value;
};

export const parseTelegramWebhookSecret = (
  mode: TelegramMode,
  raw = process.env.TELEGRAM_WEBHOOK_SECRET ?? '',
): string => {
  if (mode === 'polling') return raw;

  if (raw.length < 16 || raw.length > 256) {
    throw new Error(
      'TELEGRAM_WEBHOOK_SECRET must be 16..256 characters in webhook mode',
    );
  }
  if (!/^[A-Za-z0-9_-]+$/.test(raw)) {
    throw new Error(
      'TELEGRAM_WEBHOOK_SECRET may contain only A-Za-z0-9_- in webhook mode',
    );
  }
  return raw;
};

export const assertTelegramWebhookUrl = (
  mode: TelegramMode,
  baseUrl: string,
): void => {
  if (mode === 'webhook' && !baseUrl.startsWith('https://')) {
    throw new Error('APP_BASE_URL must start with https:// in webhook mode');
  }
};

export const configInit = () => {
  const mode = parseTelegramMode();
  const baseUrl = getEnvOrPanic('APP_BASE_URL');
  assertTelegramWebhookUrl(mode, baseUrl);

  return {
    APP: {
      port: getEnvOrPanic('APP_PORT', 'number'),
      name: getEnvOrPanic('APP_NAME'),
      allowedOrigin: getEnvOrPanic('ALLOWED_ORIGIN'),
      // Не делаем обязательным: старые .env без CREDENTIALS должны продолжать работать.
      credentials: process.env.CREDENTIALS !== 'false',
      nodeEnv: getEnvOrPanic('NODE_ENV'),
      baseUrl,
      version: getEnvOrPanic('APP_GLOBAL_DEFAULT_API_VERSION'),
      globalPrefix: getEnvOrPanic('APP_GLOBAL_PREFIX'),
      locale: getEnvOrPanic('APP_LOCALE'),
      tz: getEnvOrPanic('TZ'),
    },
    ADMIN: {
      defaultLogin: (process.env.DEFAULT_ADMIN_LOGIN ?? '').trim(),
      defaultPassword: process.env.DEFAULT_ADMIN_PASSWORD ?? '',
    },
    DATABASE: {
      port: getEnvOrPanic('DB_PORT', 'number'),
      host: getEnvOrPanic('DB_HOST'),
      type: 'postgres' as const,
      username: getEnvOrPanic('DB_USERNAME'),
      password: getEnvOrPanic('DB_PASSWORD'),
      database: getEnvOrPanic('DB_DATABASE'),
      sync: false,
      ssl: false,
      logging: false,
    },
    TELEGRAM: {
      // Пустой ADMINS_IDS — валидный сценарий: /test просто никому не доступен.
      adminIds: parsedAdminIds(process.env.ADMINS_IDS ?? ''),
      token: getEnvOrPanic('TOKEN'),
      mode,
      webhookSecret: parseTelegramWebhookSecret(mode),
    },
    CACHE: {},
    BULLMQ: {
      host: getEnvOrPanic('BULLMQ_HOST'),
      port: getEnvOrPanic('BULLMQ_PORT', 'number'),
    },
    AUTH: {
      secret: getEnvOrPanic('SECRET'),
      resave: false,
      saveUninitialized: false,
      maxAge: getEnvOrPanic('MAX_AGE', 'number'),
      httpOnly: true,
      // HTTPS включается публичным адресом, а не NODE_ENV: локально cookie должна работать по http.
      secure: baseUrl.startsWith('https://'),
      proxy: true,
      sameSite: 'lax' as const,
    },
    SWAGGER: {
      createFile: getEnvOrPanic('SWAGGER_CREATE_FILE', 'boolean'),
      enable: getEnvOrPanic('SWAGGER_ENABLE', 'boolean'),
      path: getEnvOrPanic('SWAGGER_PATH'),
    },
  };
};

export type TAuth = ReturnType<typeof configInit>['AUTH'];
export type TApp = ReturnType<typeof configInit>['APP'];
export type TAdmin = ReturnType<typeof configInit>['ADMIN'];
export type TDatabase = ReturnType<typeof configInit>['DATABASE'];
export type TTelegram = ReturnType<typeof configInit>['TELEGRAM'];
export type TCache = ReturnType<typeof configInit>['CACHE'];
export type TBullMQ = ReturnType<typeof configInit>['BULLMQ'];
export type TSwagger = ReturnType<typeof configInit>['SWAGGER'];

// Исторически в примерах использовался `_`, в документации — `,`.
// Поддерживаем оба разделителя, чтобы старые .env не ломали /test.
const parsedAdminIds = (arrIds: string): string[] => {
  return arrIds
    .split(/[_,\s]+/)
    .map((id) => id.trim())
    .filter(Boolean);
};

type EnvType = 'string' | 'number' | 'boolean';

function getEnvOrPanic(val: string, type?: 'string'): string;
function getEnvOrPanic(val: string, type?: 'number'): number;
function getEnvOrPanic(val: string, type?: 'boolean'): boolean;
function getEnvOrPanic(val: string, type?: EnvType): number | boolean | string {
  const env = process.env[val];
  if (!env) {
    throw new Error(`Value not found ${val} - ${env}`);
  }

  switch (type) {
    case 'number': {
      return +env;
    }
    case 'boolean': {
      return env === 'true';
    }
    default: {
      return env;
    }
  }
}
