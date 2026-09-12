const { error } = require('../Utilities/responseFormatter');

/**
 * Validates that required fields are present in request body.
 * @param {string[]} requiredFields 
 */
function validateBody(requiredFields = []) {
  return (req, res, next) => {
    const missing = [];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || (typeof req.body[field] === 'string' && !req.body[field].trim())) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return error(res, `Missing required fields: ${missing.join(', ')}`, 400, { missingFields: missing });
    }

    next();
  };
}

/**
 * Validates email format helper
 */
function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

module.exports = {
  validateBody,
  isValidEmail
};
