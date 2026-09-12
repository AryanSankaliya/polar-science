const arcticService = require('../Services/ArcticService');
const { success } = require('../Utilities/responseFormatter');

class ArcticController {
  async getInfo(req, res, next) {
    try {
      const info = await arcticService.getArcticInfo();
      return success(res, info, 'Indian Arctic Programme overview retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getProjects(req, res, next) {
    try {
      const projects = await arcticService.getArcticProjects();
      return success(res, projects, 'Arctic research projects retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getStations(req, res, next) {
    try {
      const stations = await arcticService.getArcticStations();
      return success(res, stations, 'Arctic research stations (Himadri) retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getMonitoring(req, res, next) {
    try {
      const monitoring = await arcticService.getArcticMonitoring();
      return success(res, monitoring, 'Arctic long-term observation and IndARC monitoring info retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getIndarc(req, res, next) {
    try {
      const indarc = await arcticService.getIndarcInfo();
      return success(res, indarc, 'IndARC underwater observatory metadata retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ArcticController();
