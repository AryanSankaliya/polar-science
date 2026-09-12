const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../Configuration/polarConfig');

/**
 * Standard API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP address, please try again after 15 minutes.'
  }
});

/**
 * Stricter rate limiter for sensitive authentication endpoints (login, register, forgot-password)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts from this IP address, please try again later.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
