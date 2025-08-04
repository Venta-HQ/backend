/**
 * Common error factories
 */
export const errors = {
  database: (message = 'Database connection failed') => new Error(message),
  validation: (message = 'Validation failed') => new Error(message),
  authentication: (message = 'Authentication failed') => new Error(message),
  authorization: (message = 'Authorization failed') => new Error(message),
  notFound: (message = 'Resource not found') => new Error(message),
  conflict: (message = 'Resource conflict') => new Error(message),
}; 