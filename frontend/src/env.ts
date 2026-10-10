import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  API_URL: {},
  API_PREFIX: {},
  SESSION_COOKIE_NAME: {},
})
