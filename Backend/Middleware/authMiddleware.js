const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../Configuration/jwtConfig');
const { error } = require('../Utilities/responseFormatter');
const { normalizeRole } = require('../Models/User');

/**
 * Authentication Middleware: Verifies Bearer JWT Token in Authorization header.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  // Support token in query parameter (crucial for browser file downloads, window.open, and direct links)
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return error(res, 'Access denied. No authentication token provided. Please sign in to continue.', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    req.user = {
      ...decoded,
      userId: userId,
      id: userId,
      role: normalizeRole(decoded.role)
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Authentication token has expired. Please refresh your token or login again.', 401, { expired: true });
    }
    return error(res, 'Invalid authentication token.', 403);
  }
}

/**
 * Optional Authentication: Attaches req.user if token is valid, otherwise proceeds without error.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userId = decoded.userId || decoded.id;
      req.user = {
        ...decoded,
        userId: userId,
        id: userId,
        role: normalizeRole(decoded.role)
      };
    } catch (err) {
      // Ignore invalid token in optional mode
    }
  }
  next();
}

module.exports = {
  authenticateToken,
  verifyToken: authenticateToken,
  optionalAuth
};
