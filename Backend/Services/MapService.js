const stationRepository = require('../Repositories/StationRepository');

class MapService {
  async getStationMapData(filters = {}) {
    const { region, country, status, discipline } = filters;
    const query = {};

    if (region && region !== 'all') {
      if (/antarct/i.test(region)) {
        query.$or = [
          { region: { $regex: 'Antarctica', $options: 'i' } },
          { latitude: { $lt: 0 } },
          { latitude: null }
        ];
      } else if (/arctic/i.test(region)) {
        query.$or = [
          { region: { $regex: 'Arctic', $options: 'i' } },
          { latitude: { $gte: 0 } },
          { name: { $regex: 'Himadri|Svalbard|Ny-Ålesund|IndARC', $options: 'i' } }
        ];
      } else {
        query.region = { $regex: region, $options: 'i' };
      }
    }
    if (country && country !== 'all') {
      query.country = { $regex: `^${country}$`, $options: 'i' };
    }
    if (status && status !== 'all') {
      query.status = { $regex: status, $options: 'i' };
    }
    if (discipline && discipline !== 'all') {
      query.research_areas = { $regex: discipline, $options: 'i' };
    }

    const stations = await stationRepository.find(query);

    return stations.map(s => ({
      station_id: s.station_id,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      country: s.country,
      region: s.region || (s.latitude < 0 ? 'Antarctica' : 'Arctic'),
      station_type: s.status,
      active_status: s.status && s.status.includes('Active'),
      is_indian_station: !!s.is_indian_station,
      established_year: s.established_year,
      operator: s.operator,
      research_areas: s.research_areas || [],
      facilities: s.facilities || [],
      location_description: s.location || ''
    }));
  }
}

module.exports = new MapService();
