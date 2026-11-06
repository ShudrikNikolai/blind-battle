/**
 * Env для e2e: значения выставляются до импорта AppModule/ConfigModule.
 * Порт 55432 фиксирован в deploy/docker-compose.test.yaml.
 */
export const TEST_DB = {
  host: process.env.E2E_DB_HOST ?? '127.0.0.1',
  port: Number(process.env.E2E_DB_PORT ?? 55432),
  user: process.env.E2E_DB_USER ?? 'test',
  password: process.env.E2E_DB_PASSWORD ?? 'test',
  database: process.env.E2E_DB_NAME ?? 'blind_battle_test',
};

const env: Record<string, string> = {
  NODE_ENV: 'test',
  TZ: 'UTC',
  ALLOWED_ORIGIN: 'http://localhost:3000',
  CREDENTIALS: 'true',
  SECRET: 'e2e-secret-e2e-secret-e2e-secret',
  MAX_AGE: '36000',
  DEFAULT_ADMIN_LOGIN: 'admin',
  DEFAULT_ADMIN_PASSWORD: 'admin12345',
  APP_NAME: 'blind-battle-e2e',
  APP_PORT: '3999',
  APP_BASE_URL: 'http://localhost:3999',
  APP_LOCALE: 'ru',
  APP_GLOBAL_PREFIX: 'api',
  APP_GLOBAL_DEFAULT_API_VERSION: '1',
  SWAGGER_ENABLE: 'false',
  SWAGGER_CREATE_FILE: 'false',
  SWAGGER_PATH: 'api/swagger',
  DB_HOST: TEST_DB.host,
  DB_PORT: String(TEST_DB.port),
  DB_USERNAME: TEST_DB.user,
  DB_PASSWORD: TEST_DB.password,
  DB_DATABASE: TEST_DB.database,
  BULLMQ_HOST: '127.0.0.1',
  BULLMQ_PORT: '56379',
  TELEGRAM_MODE: 'polling',
  TELEGRAM_WEBHOOK_SECRET: '',
  ADMINS_IDS: '',
  TOKEN: '000000000:E2E_TEST_TOKEN',
};

for (const [key, value] of Object.entries(env)) {
  process.env[key] = value;
}
