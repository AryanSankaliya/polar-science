const stationService = require('../Services/StationService');
const { success, paginated } = require('../Utilities/responseFormatter');

class StationsController {
  async getStations(req, res, next) {
    try {
      const result = await stationService.getStations(req.query);
      return paginated(res, result.stations, result.total, result.page, result.limit, 'Stations retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getIndianStations(req, res, next) {
    try {
      const stations = await stationService.getIndianStations();
      return success(res, stations, 'Indian research stations retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getStationById(req, res, next) {
    try {
      const station = await stationService.getStationById(req.params.id);
      return success(res, station, 'Station details retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getResearchers(req, res, next) {
    try {
      const researchers = await stationService.getResearchersForStation(req.params.id);
      return success(res, researchers, 'Researchers affiliated with station retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getProjects(req, res, next) {
    try {
      const projects = await stationService.getProjectsForStation(req.params.id);
      return success(res, projects, 'Projects conducted at station retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getExpeditions(req, res, next) {
    try {
      const expeditions = await stationService.getExpeditionsForStation(req.params.id);
      return success(res, expeditions, 'Expeditions visiting station retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getDatasets(req, res, next) {
    try {
      const datasets = await stationService.getDatasetsForStation(req.params.id);
      return success(res, datasets, 'Datasets recorded at station retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getPublications(req, res, next) {
    try {
      const publications = await stationService.getPublicationsForStation(req.params.id);
      return success(res, publications, 'Publications associated with station retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StationsController();
