const jwt = require('jsonwebtoken');
const userRepository = require('../Repositories/UserRepository');
const { hashPassword, comparePassword } = require('../Utilities/passwordUtils');
const { formatUserResponse, UserRoles } = require('../Models/User');
const { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } = require('../Configuration/jwtConfig');

class AuthService {
  generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
  }

  async register(userData) {
    const { email, password, name, role, institution, designation } = userData;
    if (!email || !password || !name) {
      throw { statusCode: 400, message: 'Email, password, and name are required.' };
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await userRepository.findByEmail(cleanEmail);
    if (existing) {
      throw { statusCode: 409, message: 'An account with this email address already exists.' };
    }

    const password_hash = await hashPassword(password);
    
    // Default role to 'student' unless 'researcher' is requested with institution details
    const reqRole = (role || '').toString().toLowerCase().trim();
    const inst = (institution || '').toString().trim();
    let assignedRole = UserRoles.STUDENT;
    if (reqRole === 'researcher' && inst.length > 0) {
      assignedRole = UserRoles.RESEARCHER;
    } else if (reqRole === 'admin') {
      assignedRole = UserRoles.ADMIN;
    } else {
      assignedRole = UserRoles.STUDENT;
    }

    const username = userData.username || (cleanEmail.split('@')[0] + '_' + Math.floor(1000 + Math.random() * 9000));

    const newUser = await userRepository.insertOne({
      email: cleanEmail,
      username,
      password_hash,
      name: name.trim(),
      role: assignedRole,
      institution: inst,
      designation: designation ? designation.trim() : '',
      refresh_tokens: []
    });

    const userId = newUser.id || (newUser._id ? newUser._id.toString() : '');
    const tokenPayload = {
      userId: userId,
      id: userId,
      email: newUser.email,
      name: newUser.name,
      role: assignedRole
    };

    const token = this.generateToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);
    await userRepository.addRefreshToken(newUser._id || userId, refreshToken);

    return {
      user: formatUserResponse(newUser),
      token,
      refreshToken
    };
  }

  async login(email, password) {
    if (!email || !password) {
      throw { statusCode: 400, message: 'Email and password are required.' };
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(cleanEmail);
    if (!user) {
      throw { statusCode: 401, message: 'Invalid email or password.' };
    }

    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      throw { statusCode: 401, message: 'Invalid email or password.' };
    }

    const userId = user._id ? user._id.toString() : user.id;
    const userRole = (user.role || UserRoles.STUDENT).toString().toLowerCase().trim();

    const tokenPayload = {
      userId: userId,
      id: userId,
      email: user.email,
      name: user.name,
      role: userRole
    };

    const token = this.generateToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);
    await userRepository.addRefreshToken(user._id || userId, refreshToken);

    return {
      user: formatUserResponse(user),
      token,
      refreshToken
    };
  }

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      throw { statusCode: 400, message: 'Refresh token is required.' };
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET);
    } catch (e) {
      throw { statusCode: 401, message: 'Invalid or expired refresh token.' };
    }

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw { statusCode: 401, message: 'User not found.' };
    }

    const tokenFound = (user.refresh_tokens || []).some(t => t.token === refreshToken);
    if (!tokenFound) {
      throw { statusCode: 401, message: 'Refresh token revoked or invalid.' };
    }

    const uid = user.id || (user._id ? user._id.toString() : decoded.id);
    const tokenPayload = {
      userId: uid,
      id: uid,
      email: user.email,
      name: user.name,
      role: (user.role || UserRoles.STUDENT).toString().toLowerCase().trim()
    };

    const newToken = this.generateToken(tokenPayload);
    return { token: newToken };
  }

  async logout(userId, refreshToken) {
    if (userId && refreshToken) {
      await userRepository.removeRefreshToken(userId, refreshToken);
    }
    return { message: 'Logged out successfully.' };
  }

  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found.' };
    }
    return formatUserResponse(user);
  }

  async changePassword(userId, oldPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'User not found.' };
    }

    const isValid = await comparePassword(oldPassword, user.password_hash);
    if (!isValid) {
      throw { statusCode: 400, message: 'Current password is incorrect.' };
    }

    if (!newPassword || newPassword.length < 6) {
      throw { statusCode: 400, message: 'New password must be at least 6 characters long.' };
    }

    const newHash = await hashPassword(newPassword);
    await userRepository.updatePassword(userId, newHash);
    return { message: 'Password updated successfully.' };
  }

  async forgotPassword(email) {
    const cleanEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(cleanEmail);
    // Return generic success to avoid user enumeration
    if (!user) {
      return { message: 'If that email is registered, password reset instructions have been dispatched.' };
    }
    const resetToken = jwt.sign({ id: user._id.toString(), email: user.email, purpose: 'reset_password' }, JWT_SECRET, { expiresIn: '1h' });
    return {
      message: 'Password reset token generated successfully.',
      resetToken, // Provided in development response
      instructions: 'Submit resetToken along with new password to /api/auth/reset-password'
    };
  }

  async resetPassword(resetToken, newPassword) {
    if (!resetToken || !newPassword || newPassword.length < 6) {
      throw { statusCode: 400, message: 'Valid reset token and new password (min 6 chars) are required.' };
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
      if (decoded.purpose !== 'reset_password') {
        throw new Error();
      }
    } catch (e) {
      throw { statusCode: 400, message: 'Invalid or expired password reset token.' };
    }

    const newHash = await hashPassword(newPassword);
    await userRepository.updatePassword(decoded.id, newHash);
    return { message: 'Password has been reset successfully. You can now login with your new password.' };
  }
}

module.exports = new AuthService();
