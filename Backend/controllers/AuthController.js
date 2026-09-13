const authService = require('../Services/AuthService');
const { success, error } = require('../Utilities/responseFormatter');

class AuthController {
  /**
   * POST /api/auth/register
   * Strict JSON Response Guarantee & Exception Handling
   */
  async register(req, res) {
    try {
      const { email, password, name } = req.body || {};

      // Validate required request payload
      if (!email || !password || !name || typeof email !== 'string' || typeof password !== 'string' || typeof name !== 'string' || !email.trim() || !password.trim() || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Email, password, and name are required."
        });
      }

      const result = await authService.register(req.body);
      const userObj = {
        id: result.user.id || result.user.userId,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      };

      // Return HTTP 201 with structured JSON (top-level token/user + backwards-compatible data)
      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        token: result.token,
        user: userObj,
        data: {
          token: result.token,
          user: {
            ...result.user,
            ...userObj
          },
          refreshToken: result.refreshToken
        }
      });
    } catch (err) {
      console.error('[AUTH REGISTER ERROR]', err);
      const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
      const message = err.message || "An internal error occurred during registration.";
      return res.status(statusCode).json({
        success: false,
        message
      });
    }
  }

  /**
   * POST /api/auth/login
   * Strict JSON Response Guarantee & Exception Handling
   */
  async login(req, res) {
    try {
      const { email, password } = req.body || {};

      // 3. Validate request payloads: email and password are required
      if (!email || !password || typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password.trim()) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required."
        });
      }

      // 4 & 5. Query user from MongoDB & verify credentials via authService
      const result = await authService.login(email, password);
      const userObj = {
        id: result.user.id || result.user.userId,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      };

      // 6. Successful Response Payload: HTTP 200 with structured JSON
      return res.status(200).json({
        success: true,
        token: result.token,
        user: userObj,
        data: {
          token: result.token,
          user: {
            ...result.user,
            ...userObj
          },
          refreshToken: result.refreshToken
        }
      });
    } catch (err) {
      console.error('[AUTH LOGIN ERROR]', err);
      // 2. Under NO circumstance should the server return an empty body
      const statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
      const message = err.message || "An unexpected internal server error occurred.";
      return res.status(statusCode).json({
        success: false,
        message
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body || {};
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token is required."
        });
      }
      const result = await authService.refreshToken(refreshToken);
      return res.status(200).json({
        success: true,
        message: "Token refreshed successfully",
        token: result.token,
        data: result
      });
    } catch (err) {
      console.error('[AUTH REFRESH TOKEN ERROR]', err);
      const statusCode = err.statusCode || 401;
      return res.status(statusCode).json({
        success: false,
        message: err.message || "Invalid or expired refresh token."
      });
    }
  }

  async logout(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const { refreshToken } = req.body || {};
      const result = await authService.logout(userId, refreshToken);
      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
        data: result
      });
    } catch (err) {
      console.error('[AUTH LOGOUT ERROR]', err);
      return res.status(500).json({
        success: false,
        message: "An error occurred during logout."
      });
    }
  }

  async getMe(req, res) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      return res.status(200).json({
        success: true,
        message: "Current user profile retrieved",
        user,
        data: user
      });
    } catch (err) {
      console.error('[AUTH GET ME ERROR]', err);
      const statusCode = err.statusCode || 404;
      return res.status(statusCode).json({
        success: false,
        message: err.message || "User not found."
      });
    }
  }

  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body || {};
      const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
        data: result
      });
    } catch (err) {
      console.error('[AUTH CHANGE PASSWORD ERROR]', err);
      const statusCode = err.statusCode || 400;
      return res.status(statusCode).json({
        success: false,
        message: err.message || "Failed to change password."
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body || {};
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email address is required."
        });
      }
      const result = await authService.forgotPassword(email);
      return res.status(200).json({
        success: true,
        message: result.message || "Password reset initiated",
        data: result
      });
    } catch (err) {
      console.error('[AUTH FORGOT PASSWORD ERROR]', err);
      return res.status(500).json({
        success: false,
        message: "An error occurred while initiating password reset."
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { resetToken, newPassword } = req.body || {};
      const result = await authService.resetPassword(resetToken, newPassword);
      return res.status(200).json({
        success: true,
        message: result.message || "Password reset successfully",
        data: result
      });
    } catch (err) {
      console.error('[AUTH RESET PASSWORD ERROR]', err);
      const statusCode = err.statusCode || 400;
      return res.status(statusCode).json({
        success: false,
        message: err.message || "Failed to reset password."
      });
    }
  }
}

module.exports = new AuthController();
