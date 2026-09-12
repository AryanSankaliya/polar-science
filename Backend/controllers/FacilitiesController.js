const facilityService = require('../Services/FacilityService');
const { success, paginated } = require('../Utilities/responseFormatter');

class FacilitiesController {
  async getFacilities(req, res, next) {
    try {
      const result = await facilityService.getFacilities(req.query);
      return paginated(res, result.facilities, result.total, result.page, result.limit, 'Facilities retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getFacilityById(req, res, next) {
    try {
      const facility = await facilityService.getFacilityById(req.params.id);
      return success(res, facility, 'Facility details retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FacilitiesController();
