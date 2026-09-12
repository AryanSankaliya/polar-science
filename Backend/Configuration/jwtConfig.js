require('dotenv').config();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'polar_hub_enterprise_secret_key_2026_ncpor_sih',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '2h',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  PASSWORD_SALT_ROUNDS: 10
};
