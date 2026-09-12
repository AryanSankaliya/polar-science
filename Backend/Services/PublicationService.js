const publicationRepository = require('../Repositories/PublicationRepository');
const datasetRepository = require('../Repositories/DatasetRepository');
const projectRepository = require('../Repositories/ProjectRepository');

class PublicationService {
  async getPublications(query = {}) {
    const { search, year, keyword, keywords, discipline, limit = 50, page = 1 } = query;
    const filter = {};

    const kw = keyword || keywords;
    const searchTerm = search || kw;

    if (searchTerm && searchTerm.trim()) {
      const regex = new RegExp(searchTerm.trim(), 'i');
      filter.$or = [
        { title: regex },
        { authors: regex },
        { journal: regex },
        { abstract: regex },
        { keywords: regex }
      ];
    }
    if (year) {
      filter.year = parseInt(year, 10);
    }
    if (discipline && discipline.trim()) {
      filter.disciplines = { $regex: discipline.trim(), $options: 'i' };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const parsedLimit = parseInt(limit, 10);

    const [publications, total] = await Promise.all([
      publicationRepository.find(filter, { skip, limit: parsedLimit, sort: { year: -1 } }),
      publicationRepository.count(filter)
    ]);

    return { publications, total, page: parseInt(page, 10), limit: parsedLimit };
  }

  async getPublicationById(id) {
    const pub = await publicationRepository.findByPubIdOrDoi(id);
    if (!pub) {
      throw { statusCode: 404, message: `Publication not found for id: ${id}` };
    }
    const datasets = await datasetRepository.find({
      dataset_id: { $in: pub.dataset_ids || [] }
    });
    const projects = await projectRepository.find({
      project_code: { $in: pub.project_ids || [] }
    });

    return {
      ...pub,
      datasets,
      projects
    };
  }

  async searchPublications(q) {
    return publicationRepository.search(q);
  }
}

module.exports = new PublicationService();
