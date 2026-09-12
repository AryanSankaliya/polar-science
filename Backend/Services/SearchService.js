const researcherRepository = require('../Repositories/ResearcherRepository');
const stationRepository = require('../Repositories/StationRepository');
const expeditionRepository = require('../Repositories/ExpeditionRepository');
const projectRepository = require('../Repositories/ProjectRepository');
const publicationRepository = require('../Repositories/PublicationRepository');
const datasetRepository = require('../Repositories/DatasetRepository');
const documentRepository = require('../Repositories/DocumentRepository');
const facilityRepository = require('../Repositories/FacilityRepository');
const scienceRepository = require('../Repositories/ScienceRepository');
const environmentRepository = require('../Repositories/EnvironmentRepository');

class SearchService {
  async globalSearch(queryStr, filters = {}) {
    if (!queryStr || typeof queryStr !== 'string' || !queryStr.trim()) {
      return {
        query: '',
        total_matches: 0,
        researchers: [],
        stations: [],
        expeditions: [],
        projects: [],
        publications: [],
        datasets: [],
        documents: [],
        facilities: [],
        science_topics: [],
        environmental_records: []
      };
    }

    const q = queryStr.trim();
    const regex = new RegExp(q, 'i');

    const [
      researchers,
      stations,
      expeditions,
      projects,
      publications,
      datasets,
      documents,
      facilities,
      scienceTopics,
      envRecords
    ] = await Promise.all([
      researcherRepository.find({
        $or: [
          { name: regex },
          { institution: regex },
          { research_interests: regex },
          { disciplines: regex }
        ]
      }, { limit: 10 }),

      stationRepository.find({
        $or: [
          { name: regex },
          { location: regex },
          { country: regex },
          { operator: regex }
        ]
      }, { limit: 10 }),

      expeditionRepository.find({
        $or: [
          { expedition_number: regex },
          { expedition_title: regex },
          { vessel: regex },
          { ports: regex },
          { operational_highlights: regex }
        ]
      }, { limit: 10 }),

      projectRepository.find({
        $or: [
          { project_code: regex },
          { title: regex },
          { description: regex },
          { lead_researcher_name: regex }
        ]
      }, { limit: 10 }),

      publicationRepository.find({
        $or: [
          { title: regex },
          { authors: regex },
          { journal: regex },
          { abstract: regex },
          { keywords: regex }
        ]
      }, { limit: 10 }),

      datasetRepository.find({
        $or: [
          { dataset_id: regex },
          { title: regex },
          { description: regex },
          { discipline: regex },
          { parameters: regex }
        ]
      }, { limit: 10 }),

      documentRepository.find({
        $or: [
          { title: regex },
          { description: regex },
          { author: regex },
          { keywords: regex }
        ]
      }, { limit: 10 }),

      facilityRepository.find({
        $or: [
          { name: regex },
          { location: regex },
          { research_areas: regex },
          { equipment: regex }
        ]
      }, { limit: 10 }),

      scienceRepository.find({
        $or: [
          { name: regex },
          { domain: regex },
          { description: regex },
          { key_topics: regex }
        ]
      }, { limit: 10 }),

      environmentRepository.find({
        $or: [
          { title: regex },
          { summary: regex },
          { details: regex },
          { category: regex }
        ]
      }, { limit: 10 })
    ]);

    const totalMatches =
      researchers.length +
      stations.length +
      expeditions.length +
      projects.length +
      publications.length +
      datasets.length +
      documents.length +
      facilities.length +
      scienceTopics.length +
      envRecords.length;

    return {
      query: q,
      total_matches: totalMatches,
      researchers,
      stations,
      expeditions,
      projects,
      publications,
      datasets,
      documents,
      facilities,
      science_topics: scienceTopics,
      environmental_records: envRecords
    };
  }
}

module.exports = new SearchService();
