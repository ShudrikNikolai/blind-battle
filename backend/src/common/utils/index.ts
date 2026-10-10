export const API_RESPONSE_TIMEOUT = 10_000 as const;
export const API_ERROR = {
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
  UNHANDLED_EXCEPTION: 'Unhandled exception',

  BAD_REQUEST: 'Bad request',
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource conflict',
  TOO_MANY_REQUESTS: 'Too many requests',
  SERVICE_UNAVAILABLE: 'Service unavailable',
  BODY_LARGE: 'Request body is too large',
  TIMEOUT: 'HTTP request timeout',
};
export const SESSION_AUTH = 'session';
