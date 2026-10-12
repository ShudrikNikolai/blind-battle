const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
const prefix = process.env.API_PREFIX ?? '/api/v1';
const cookieName = process.env.SESSION_COOKIE_NAME ?? 'connect.sid'

export const config = {
  apiBase: `${apiUrl}${prefix}`,
  cookieName
};
