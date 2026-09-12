const userRepository = require('../Repositories/UserRepository');
const { formatUserResponse, UserRoles } = require('../Models/User');

class UserService {
  async getAllUsers(options = {}) {
    const users = await userRepository.find({}, options);
    const total = await userRepository.count({});
    return {
      users: users.map(formatUserResponse),
      total
    };
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw { statusCode: 404, message: `User not found for id: ${id}` };
    }
    return formatUserResponse(user);
  }

  async updateUserRole(id, newRole) {
    if (!Object.values(UserRoles).includes(newRole)) {
      throw { statusCode: 400, message: `Invalid role. Allowed roles: [${Object.values(UserRoles).join(', ')}]` };
    }
    const user = await userRepository.findById(id);
    if (!user) {
      throw { statusCode: 404, message: `User not found for id: ${id}` };
    }
    await userRepository.updateOne({ _id: user._id }, { role: newRole });
    const updated = await userRepository.findById(id);
    return formatUserResponse(updated);
  }

  async deleteUser(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw { statusCode: 404, message: `User not found for id: ${id}` };
    }
    await userRepository.deleteOne({ _id: user._id });
    return { message: 'User deleted successfully.' };
  }
}

module.exports = new UserService();
