const antarcticaService = require('../Services/AntarcticaService');
const { success } = require('../Utilities/responseFormatter');

class AntarcticaController {
  async getInfo(req, res, next) {
    try {
      const info = await antarcticaService.getAntarcticaInfo();
      return success(res, info, 'Antarctica programme overview retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getPrograms(req, res, next) {
    try {
      const programs = await antarcticaService.getIndianPrograms();
      return success(res, programs, 'Indian Antarctic programmes retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getRecords(req, res, next) {
    try {
      const records = await antarcticaService.getRecords();
      return success(res, records, 'Antarctic milestones and records retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getTimeline(req, res, next) {
    try {
      const timeline = await antarcticaService.getAntarcticaTimeline();
      return success(res, timeline, 'Antarctic timeline retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getProtectedAreas(req, res, next) {
    try {
      const areas = await antarcticaService.getProtectedAreas();
      return success(res, areas, 'Antarctic protected areas retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AntarcticaController();
