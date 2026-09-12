const projectService = require('../Services/ProjectService');
const { success, paginated } = require('../Utilities/responseFormatter');

class ProjectsController {
  async getProjects(req, res, next) {
    try {
      const result = await projectService.getProjects(req.query);
      return paginated(res, result.projects, result.total, result.page, result.limit, 'Projects retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getProjectById(req, res, next) {
    try {
      const project = await projectService.getProjectById(req.params.id);
      return success(res, project, 'Project details retrieved');
    } catch (err) {
      next(err);
    }
  }

  async searchProjects(req, res, next) {
    try {
      const q = req.query.q || '';
      const projects = await projectService.searchProjects(q);
      return success(res, projects, 'Project search results');
    } catch (err) {
      next(err);
    }
  }

  async createProject(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      const project = await projectService.createProject(req.body, userId);
      return success(res, project, 'Project created successfully', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProjectsController();
