const stationRepository = require('../Repositories/StationRepository');
const researcherRepository = require('../Repositories/ResearcherRepository');
const projectRepository = require('../Repositories/ProjectRepository');
const expeditionRepository = require('../Repositories/ExpeditionRepository');
const datasetRepository = require('../Repositories/DatasetRepository');
const publicationRepository = require('../Repositories/PublicationRepository');

class StationService {
  formatStation(station) {
    if (!station) return null;
    const doc = { ...station };
    if (doc._id) {
      if (!doc.id) doc.id = doc._id.toString();
      delete doc._id;
    }
    const lat = doc.latitude !== undefined ? Number(doc.latitude) : (doc.coordinates?.lat !== undefined ? Number(doc.coordinates.lat) : 0);
    const lng = doc.longitude !== undefined ? Number(doc.longitude) : (doc.coordinates?.lng !== undefined ? Number(doc.coordinates.lng) : 0);
    doc.coordinates = { lat, lng };
    doc.latitude = lat;
    doc.longitude = lng;
    return doc;
  }

  async getStations(query = {}) {
    const { country, status, region, realm, search, limit = 100, page = 1 } = query;
    const filter = {};

    if (country && country !== 'all' && country.trim()) {
      filter.country = { $regex: `^${country.trim()}$`, $options: 'i' };
    }
    if (status && status !== 'all' && status.trim()) {
      filter.status = { $regex: `^${status.trim()}$`, $options: 'i' };
    }
    
    const realmOrRegion = realm || region;
    if (realmOrRegion && realmOrRegion !== 'all' && realmOrRegion.trim()) {
      const r = realmOrRegion.trim();
      filter.$or = [
        { realm: { $regex: `^${r}$`, $options: 'i' } },
        { region: { $regex: `^${r}$`, $options: 'i' } },
        { location: { $regex: r, $options: 'i' } }
      ];
    }

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: 'i' };
      const searchCond = [
        { name: regex },
        { location: regex },
        { operator: regex },
        { country: regex }
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchCond }];
        delete filter.$or;
      } else {
        filter.$or = searchCond;
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const parsedLimit = parseInt(limit, 10);

    const [stations, total, countries, statuses, regions] = await Promise.all([
      stationRepository.find(filter, {
        sort: { is_indian_station: -1, name: 1 },
        skip,
        limit: parsedLimit
      }),
      stationRepository.count(filter),
      stationRepository.distinct('country'),
      stationRepository.distinct('status'),
      stationRepository.distinct('region')
    ]);

    const formattedStations = stations.map(s => this.formatStation(s));

    return {
      stations: formattedStations,
      total,
      page: parseInt(page, 10),
      limit: parsedLimit,
      available_countries: (countries || []).sort(),
      available_statuses: (statuses || []).sort(),
      available_regions: (regions || []).sort()
    };
  }

  async getStationById(id) {
    const station = await stationRepository.findBySlugOrId(id);
    if (!station) {
      throw { statusCode: 404, message: `Station not found for id: ${id}` };
    }
    return this.formatStation(station);
  }

  async getIndianStations() {
    const stations = await stationRepository.findIndianStations();
    return stations.map(s => this.formatStation(s));
  }

  async getResearchersForStation(id) {
    const station = await this.getStationById(id);
    const stnId = station.station_id || id;
    return researcherRepository.find({
      $or: [
        { stations: stnId },
        { stations: station.name }
      ]
    });
  }

  async getProjectsForStation(id) {
    const station = await this.getStationById(id);
    const stnId = station.station_id || id;
    return projectRepository.find({
      $or: [
        { station_ids: stnId },
        { station_ids: station.name }
      ]
    });
  }

  async getExpeditionsForStation(id) {
    const station = await this.getStationById(id);
    const stnName = station.name;
    return expeditionRepository.find({
      $or: [
        { ports: { $regex: stnName, $options: 'i' } },
        { route: { $regex: stnName, $options: 'i' } },
        { operational_highlights: { $regex: stnName, $options: 'i' } }
      ]
    });
  }

  async getDatasetsForStation(id) {
    const station = await this.getStationById(id);
    const stnId = station.station_id || id;
    return datasetRepository.find({
      $or: [
        { station_id: stnId },
        { location: { $regex: station.name, $options: 'i' } }
      ]
    });
  }

  async getPublicationsForStation(id) {
    const station = await this.getStationById(id);
    const stnId = station.station_id || id;
    return publicationRepository.find({
      $or: [
        { station_ids: stnId },
        { title: { $regex: station.name, $options: 'i' } },
        { abstract: { $regex: station.name, $options: 'i' } }
      ]
    });
  }
}

module.exports = new StationService();
