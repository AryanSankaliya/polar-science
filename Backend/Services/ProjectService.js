const projectRepository = require('../Repositories/ProjectRepository');
const publicationRepository = require('../Repositories/PublicationRepository');
const datasetRepository = require('../Repositories/DatasetRepository');

class ProjectService {
  async getProjects(query = {}) {
    const { search, discipline, station, status, limit = 50, page = 1 } = query;
    const filter = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { project_code: regex },
        { title: regex },
        { description: regex },
        { lead_researcher_name: regex }
      ];
    }
    if (discipline && discipline.trim()) {
      filter.science_disciplines = { $regex: discipline.trim(), $options: 'i' };
    }
    if (station && station.trim()) {
      filter.station_ids = station.trim();
    }
    if (status && status.trim()) {
      filter.status = status.trim();
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const parsedLimit = parseInt(limit, 10);

    const [projects, total] = await Promise.all([
      projectRepository.find(filter, { skip, limit: parsedLimit, sort: { project_code: 1 } }),
      projectRepository.count(filter)
    ]);

    return { projects, total, page: parseInt(page, 10), limit: parsedLimit };
  }

  async getProjectById(id) {
    const project = await projectRepository.findByCodeOrId(id);
    if (!project) {
      throw { statusCode: 404, message: `Project not found for id: ${id}` };
    }
    // Fetch associated publications and datasets
    const publications = await publicationRepository.find({
      $or: [
        { project_ids: project.project_code },
        { publication_id: { $in: project.publication_ids || [] } }
      ]
    });
    const datasets = await datasetRepository.find({
      $or: [
        { dataset_id: { $in: project.dataset_ids || [] } }
      ]
    });

    return {
      ...project,
      publications,
      datasets
    };
  }

  async searchProjects(q) {
    return projectRepository.search(q);
  }

  async createProject(data, userId) {
    if (!data.title || !data.project_code) {
      throw { statusCode: 400, message: 'Project code and title are required.' };
    }
    const existing = await projectRepository.findByCodeOrId(data.project_code);
    if (existing) {
      throw { statusCode: 409, message: `Project code '${data.project_code}' already exists.` };
    }
    return projectRepository.insertOne({
      ...data,
      created_by: userId
    });
  }
}

module.exports = new ProjectService();
