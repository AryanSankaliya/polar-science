const environmentService = require('../Services/EnvironmentService');
const { success } = require('../Utilities/responseFormatter');

class EnvironmentController {
  async getRecords(req, res, next) {
    try {
      const records = await environmentService.getRecords(req.query);
      return success(res, records, 'Environmental protection and policy records retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getRecordById(req, res, next) {
    try {
      const record = await environmentService.getRecordById(req.params.id);
      return success(res, record, 'Environmental record details retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getTreaty(req, res, next) {
    try {
      const treaty = await environmentService.getTreatyInfo();
      return success(res, treaty, 'Antarctic Treaty System records retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getProtectedAreas(req, res, next) {
    try {
      const areas = await environmentService.getProtectedAreas();
      return success(res, areas, 'Specially Protected and Managed Areas retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getGuidelines(req, res, next) {
    try {
      const guidelines = await environmentService.getGuidelines();
      return success(res, guidelines, 'Environmental guidelines and biosecurity protocols retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new EnvironmentController();
