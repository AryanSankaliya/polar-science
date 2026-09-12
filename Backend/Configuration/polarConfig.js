require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_NAME: 'Polar Research Information Platform API',
  API_VERSION: 'v1.0.0',
  CORS_ORIGINS: process.env.CORS_ORIGIN
    ? (process.env.CORS_ORIGIN === '*' ? '*' : process.env.CORS_ORIGIN.split(','))
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        '*'
      ],
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 500 // Limit each IP
  },
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};
