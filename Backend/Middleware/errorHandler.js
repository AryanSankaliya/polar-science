const { error } = require('../Utilities/responseFormatter');

/**
 * Global Express Error Handling Middleware
 * Guarantees a structured JSON response under all circumstances (no empty bodies)
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error('[UNCAUGHT EXCEPTION]', {
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle common syntax/JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Invalid JSON payload received.'
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      statusCode: 409,
      message: `A record with this ${field} already exists.`
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
  });
}

module.exports = errorHandler;
