const facilityRepository = require('../Repositories/FacilityRepository');
const stationRepository = require('../Repositories/StationRepository');

class FacilityService {
  async getFacilities(query = {}) {
    const { region, type, station, limit = 50, page = 1 } = query;
    const filter = {};

    if (region && region.trim()) {
      filter.region = { $regex: region.trim(), $options: 'i' };
    }
    if (type && type.trim()) {
      filter.type = { $regex: type.trim(), $options: 'i' };
    }
    if (station && station.trim()) {
      filter.station_id = station.trim();
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const parsedLimit = parseInt(limit, 10);

    const [facilities, total] = await Promise.all([
      facilityRepository.find(filter, { skip, limit: parsedLimit, sort: { name: 1 } }),
      facilityRepository.count(filter)
    ]);

    return { facilities, total, page: parseInt(page, 10), limit: parsedLimit };
  }

  async getFacilityById(id) {
    const facility = await facilityRepository.findByFacilityId(id);
    if (!facility) {
      throw { statusCode: 404, message: `Facility not found for id: ${id}` };
    }
    let station = null;
    if (facility.station_id) {
      station = await stationRepository.findBySlugOrId(facility.station_id);
    }
    return {
      ...facility,
      station
    };
  }
}

module.exports = new FacilityService();
