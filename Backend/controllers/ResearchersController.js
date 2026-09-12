const researcherService = require('../Services/ResearcherService');
const { success, paginated } = require('../Utilities/responseFormatter');

class ResearchersController {
  async getResearchers(req, res, next) {
    try {
      const { researchers, total, page, limit } = await researcherService.getResearchers(req.query);
      return paginated(res, researchers, total, page, limit, 'Researchers retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getResearcherById(req, res, next) {
    try {
      const researcher = await researcherService.getResearcherById(req.params.id);
      return success(res, researcher, 'Researcher details retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getProjects(req, res, next) {
    try {
      const projects = await researcherService.getProjectsForResearcher(req.params.id);
      return success(res, projects, 'Projects for researcher retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getPublications(req, res, next) {
    try {
      const publications = await researcherService.getPublicationsForResearcher(req.params.id);
      return success(res, publications, 'Publications for researcher retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getExpeditions(req, res, next) {
    try {
      const expeditions = await researcherService.getExpeditionsForResearcher(req.params.id);
      return success(res, expeditions, 'Expeditions for researcher retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getStations(req, res, next) {
    try {
      const stations = await researcherService.getStationsForResearcher(req.params.id);
      return success(res, stations, 'Stations affiliated with researcher retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getDatasets(req, res, next) {
    try {
      const datasets = await researcherService.getDatasetsForResearcher(req.params.id);
      return success(res, datasets, 'Datasets produced by researcher retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ResearchersController();
