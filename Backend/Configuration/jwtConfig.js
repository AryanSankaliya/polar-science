require('dotenv').config();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'polaris_default_jwt_secret_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  PASSWORD_SALT_ROUNDS: 10
};
