const { error } = require('../Utilities/responseFormatter');

/**
 * Global Express Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[UNCAUGHT EXCEPTION]', {
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle common syntax/JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return error(res, 'Invalid JSON payload received.', 400);
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return error(res, `A record with this ${field} already exists.`, 409);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.isOperational || process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'An unexpected internal server error occurred.';

  return error(res, message, statusCode, process.env.NODE_ENV === 'development' ? { stack: err.stack } : null);
}

module.exports = errorHandler;
