const userService = require('../Services/UserService');
const { success, paginated } = require('../Utilities/responseFormatter');

class UsersController {
  async getAllUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const skip = (page - 1) * limit;

      const { users, total } = await userService.getAllUsers({ skip, limit });
      return paginated(res, users, total, page, limit, 'Users retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      return success(res, user, 'User details retrieved', 200);
    } catch (err) {
      next(err);
    }
  }

  async updateUserRole(req, res, next) {
    try {
      const { role } = req.body;
      const updated = await userService.updateUserRole(req.params.id, role);
      return success(res, updated, 'User role updated successfully', 200);
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id);
      return success(res, result, 'User deleted', 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UsersController();
