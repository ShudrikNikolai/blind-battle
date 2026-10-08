export const configInit = () => ({
  IS_DEV: !!process.env.IS_DEV,
  APP: {
    port: process.env.APP_PORT,
    name: process.env.APP_NAME,
    allowedOrigin: process.env.ALLOWED_ORIGIN,
    nodeEnv: process.env.NODE_ENV,
    baseUrl: process.env.APP_BASE_URL,
    version: process.env.APP_GLOBAL_DEFAULT_API_VERSION,
    globalPrefix: process.env.APP_GLOBAL_PREFIX,
    locale: process.env.APP_LOCALE,
    tz: process.env.TZ,
  },
  DATABASE: {
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    type: process.env.DB_TYPE,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    sync: false,
    ssl: false,
    logging: false,
  },
  TELEGRAM: {
    ADMINS_IDS: parsedAdminIds(process.env.ADMINS_IDS),
    TOKEN: process.env.TOKEN,
  },
  CACHE: {},
  BULLMQ: {
    HOST: process.env.BULLMQ_HOST,
    PORT: process.env.BULLMQ_PORT,
  },
  AUTH: {
    SECRET: process.env.SECRET,
    RESAVE: false,
    SAVE_UNINIT: false,
    MAX_AGE: process.env.MAX_AGE,
    HTTP_ONLY: true,
    SECURE: false,
  },
});

export interface IApp {
  port: string;
  name: string;
  allowedOrigin: string;
  nodeEnv: string;
  baseUrl: string;
  version: string;
  globalPrefix: string;
  locale: string;
  tz: string;
}

export interface IDatabase {
  port: number;
  host: string;
  type: 'postgres';
  username: string;
  password: string;
  database: string;
  sync: boolean;
  ssl: boolean;
  logging: boolean;
}

export interface ITelegram {
  ADMINS_IDS: number[];
  TOKEN: string;
}

export interface ICache {}

export interface IBullMQ {
  HOST: string;
  PORT: string;
}

export interface IAuth {
  SECRET: string;
  RESAVE: boolean;
  SAVE_UNINIT: boolean;
  MAX_AGE: string;
  HTTP_ONLY: boolean;
  SECURE: boolean;
}

const parsedAdminIds = (arrIds: string | undefined): number[] => {
  if (!arrIds) return [];
  return arrIds.split('_').map((id) => Number(id));
};
