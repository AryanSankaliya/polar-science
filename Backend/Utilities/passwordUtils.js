const bcrypt = require('bcryptjs');
const { PASSWORD_SALT_ROUNDS } = require('../Configuration/jwtConfig');

/**
 * Hashes a plaintext password securely using bcrypt.
 * @param {string} password 
 * @returns {Promise<string>}
 */
async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = await bcrypt.genSalt(PASSWORD_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a candidate password with a stored hash.
 * @param {string} candidatePassword 
 * @param {string} hashedPassword 
 * @returns {Promise<boolean>}
 */
async function comparePassword(candidatePassword, hashedPassword) {
  if (!candidatePassword || !hashedPassword) {
    return false;
  }
  return bcrypt.compare(candidatePassword, hashedPassword);
}

module.exports = {
  hashPassword,
  comparePassword
};
