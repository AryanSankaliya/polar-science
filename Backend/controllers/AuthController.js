const authService = require('../Services/AuthService');
const { success, error } = require('../Utilities/responseFormatter');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return success(res, result, 'User registered successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return success(res, result, 'Login successful', 200);
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      return success(res, result, 'Token refreshed successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      const { refreshToken } = req.body;
      const result = await authService.logout(userId, refreshToken);
      return success(res, result, 'Logged out successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      return success(res, user, 'Current user profile retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
      return success(res, result, 'Password changed successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      return success(res, result, 'Password reset initiated', 200);
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { resetToken, newPassword } = req.body;
      const result = await authService.resetPassword(resetToken, newPassword);
      return success(res, result, 'Password reset successfully', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
