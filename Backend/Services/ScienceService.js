const scienceRepository = require('../Repositories/ScienceRepository');
const projectRepository = require('../Repositories/ProjectRepository');
const datasetRepository = require('../Repositories/DatasetRepository');
const publicationRepository = require('../Repositories/PublicationRepository');
const researcherRepository = require('../Repositories/ResearcherRepository');

class ScienceService {
  async getDisciplines() {
    return scienceRepository.find({}, { sort: { name: 1 } });
  }

  async getDisciplineById(id) {
    const discipline = await scienceRepository.findByDisciplineId(id);
    if (!discipline) {
      throw { statusCode: 404, message: `Science discipline not found for id: ${id}` };
    }
    const nameRegex = new RegExp(discipline.name, 'i');

    const [projects, datasets, publications, researchers] = await Promise.all([
      projectRepository.find({ science_disciplines: nameRegex }),
      datasetRepository.find({ discipline: nameRegex }),
      publicationRepository.find({ disciplines: nameRegex }),
      researcherRepository.find({ disciplines: nameRegex })
    ]);

    return {
      ...discipline,
      projects,
      datasets,
      publications,
      researchers
    };
  }

  async getProjectsByDiscipline(id) {
    const discipline = await scienceRepository.findByDisciplineId(id);
    const name = discipline ? discipline.name : id;
    return projectRepository.find({ science_disciplines: { $regex: name, $options: 'i' } });
  }

  async getDatasetsByDiscipline(id) {
    const discipline = await scienceRepository.findByDisciplineId(id);
    const name = discipline ? discipline.name : id;
    return datasetRepository.find({ discipline: { $regex: name, $options: 'i' } });
  }
}

module.exports = new ScienceService();
