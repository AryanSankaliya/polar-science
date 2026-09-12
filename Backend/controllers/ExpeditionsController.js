const expeditionService = require('../Services/ExpeditionService');
const { success, paginated } = require('../Utilities/responseFormatter');

class ExpeditionsController {
  async getExpeditions(req, res, next) {
    try {
      const result = await expeditionService.getExpeditions(req.query);
      return paginated(res, result.expeditions, result.total, result.page, result.limit, 'Expeditions retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getExpeditionById(req, res, next) {
    try {
      const expedition = await expeditionService.getExpeditionById(req.params.id);
      return success(res, expedition, 'Expedition details and evidence chunks retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getTimeline(req, res, next) {
    try {
      const timeline = await expeditionService.getExpeditionTimeline();
      return success(res, timeline, 'Chronological expedition timeline retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getResearchers(req, res, next) {
    try {
      const researchers = await expeditionService.getResearchersForExpedition(req.params.id);
      return success(res, researchers, 'Expedition scientists and leadership retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getStations(req, res, next) {
    try {
      const stations = await expeditionService.getStationsForExpedition(req.params.id);
      return success(res, stations, 'Stations resupplied or visited during expedition retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getProjects(req, res, next) {
    try {
      const projects = await expeditionService.getProjectsForExpedition(req.params.id);
      return success(res, projects, 'Scientific projects executed during expedition retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getReports(req, res, next) {
    try {
      const reports = await expeditionService.getReportsForExpedition(req.params.id);
      return success(res, reports, 'Official expedition reports and grounded text chunks retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ExpeditionsController();
