export const configInit = () => ({
  IS_DEV: getEnvOrPanic('IS_DEV') === 'dev',
  APP: {
    port: getEnvOrPanic('APP_PORT', 'number'),
    name: getEnvOrPanic('APP_NAME'),
    allowedOrigin: getEnvOrPanic('ALLOWED_ORIGIN'),
    nodeEnv: getEnvOrPanic('NODE_ENV'),
    baseUrl: getEnvOrPanic('APP_BASE_URL'),
    version: getEnvOrPanic('APP_GLOBAL_DEFAULT_API_VERSION'),
    globalPrefix: getEnvOrPanic('APP_GLOBAL_PREFIX'),
    locale: getEnvOrPanic('APP_LOCALE'),
    tz: getEnvOrPanic('TZ'),
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
    adminIds: parsedAdminIds(getEnvOrPanic('ADMINS_IDS')),
    token: getEnvOrPanic('TOKEN'),
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
    secure: false,
  },
  SWAGGER: {
    createFile: getEnvOrPanic('SWAGGER_CREATE_FILE', 'boolean'),
    enable: getEnvOrPanic('SWAGGER_ENABLE', 'boolean'),
    path: getEnvOrPanic('SWAGGER_PATH'),
  },
});

const conf = configInit();
export type TAuth = typeof conf.AUTH;
export type TApp = typeof conf.APP;
export type TDatabase = typeof conf.DATABASE;
export type TTelegram = typeof conf.TELEGRAM;
export type TCache = typeof conf.CACHE;
export type TBullMQ = typeof conf.BULLMQ;
export type TSwagger = typeof conf.SWAGGER;

const parsedAdminIds = (arrIds: string): number[] => {
  return arrIds.split('_').map((id) => Number(id));
};

type EnvType = 'string' | 'number' | 'boolean';

function getEnvOrPanic(val: string, type?: 'string'): string;
function getEnvOrPanic(val: string, type?: 'number'): number;
function getEnvOrPanic(val: string, type?: 'boolean'): boolean;
function getEnvOrPanic(val: string, type?: EnvType): number | boolean | string {
  let env = process.env[val];
  if (!env) {
    throw new Error('Value not found');
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
