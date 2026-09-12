const researcherRepository = require('../Repositories/ResearcherRepository');
const projectRepository = require('../Repositories/ProjectRepository');
const publicationRepository = require('../Repositories/PublicationRepository');
const expeditionRepository = require('../Repositories/ExpeditionRepository');
const stationRepository = require('../Repositories/StationRepository');
const datasetRepository = require('../Repositories/DatasetRepository');

class ResearcherService {
  async getResearchers(query = {}) {
    const { search, discipline, institution, limit = 50, page = 1 } = query;
    const filter = {};
    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { designation: regex },
        { institution: regex },
        { research_interests: regex }
      ];
    }
    if (discipline) {
      filter.disciplines = { $regex: discipline.trim(), $options: 'i' };
    }
    if (institution) {
      filter.institution = { $regex: institution.trim(), $options: 'i' };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const parsedLimit = parseInt(limit, 10);

    const [researchers, total] = await Promise.all([
      researcherRepository.find(filter, { skip, limit: parsedLimit, sort: { name: 1 } }),
      researcherRepository.count(filter)
    ]);

    return { researchers, total, page: parseInt(page, 10), limit: parsedLimit };
  }

  async getResearcherById(id) {
    const researcher = await researcherRepository.findBySlugOrId(id);
    if (!researcher) {
      throw { statusCode: 404, message: `Researcher not found for id: ${id}` };
    }
    return researcher;
  }

  async getProjectsForResearcher(id) {
    const researcher = await this.getResearcherById(id);
    const rId = researcher.researcher_id || id;
    return projectRepository.find({
      $or: [
        { lead_researcher_id: rId },
        { lead_researcher_name: { $regex: researcher.name, $options: 'i' } },
        { project_code: { $in: researcher.projects || [] } }
      ]
    });
  }

  async getPublicationsForResearcher(id) {
    const researcher = await this.getResearcherById(id);
    const rId = researcher.researcher_id || id;
    return publicationRepository.find({
      $or: [
        { authors: { $regex: researcher.name, $options: 'i' } },
        { publication_id: { $in: researcher.publications || [] } }
      ]
    });
  }

  async getExpeditionsForResearcher(id) {
    const researcher = await this.getResearcherById(id);
    const expIds = researcher.expeditions || [];
    return expeditionRepository.find({
      $or: [
        { document_id: { $in: expIds } },
        { expedition_number: { $in: expIds } },
        { leaders: { $regex: researcher.name, $options: 'i' } }
      ]
    });
  }

  async getStationsForResearcher(id) {
    const researcher = await this.getResearcherById(id);
    const stnIds = researcher.stations || [];
    return stationRepository.find({
      $or: [
        { station_id: { $in: stnIds } },
        { name: { $in: stnIds } }
      ]
    });
  }

  async getDatasetsForResearcher(id) {
    const researcher = await this.getResearcherById(id);
    return datasetRepository.find({
      $or: [
        { creator: { $regex: researcher.name, $options: 'i' } },
        { station_id: { $in: researcher.stations || [] } }
      ]
    });
  }
}

module.exports = new ResearcherService();
