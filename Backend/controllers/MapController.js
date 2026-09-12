const mapService = require('../Services/MapService');
const { success } = require('../Utilities/responseFormatter');

class MapController {
  async getStationMap(req, res, next) {
    try {
      const data = await mapService.getStationMapData(req.query);
      return success(res, data, 'Station geospatial map records retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MapController();
