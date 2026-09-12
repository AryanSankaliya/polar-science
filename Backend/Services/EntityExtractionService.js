const stationRepository = require('../Repositories/StationRepository');
const researcherRepository = require('../Repositories/ResearcherRepository');
const projectRepository = require('../Repositories/ProjectRepository');

class EntityExtractionService {
  /**
   * Extracts recognized polar entities (stations, researchers, disciplines, projects) from arbitrary text.
   * @param {string} text 
   */
  async extractEntitiesFromText(text) {
    if (!text || typeof text !== 'string') {
      return { detected_entities: [], linked_relations: [] };
    }

    const tLower = text.toLowerCase();
    const detected = [];

    // Check stations
    const stations = await stationRepository.find({});
    for (const stn of stations) {
      if (tLower.includes(stn.name.toLowerCase())) {
        detected.push({ id: stn.station_id || stn.name, name: stn.name, type: 'Station' });
      }
    }

    // Check researchers
    const researchers = await researcherRepository.find({});
    for (const res of researchers) {
      if (tLower.includes(res.name.toLowerCase())) {
        detected.push({ id: res.researcher_id, name: res.name, type: 'Researcher' });
      }
    }

    // Check disciplines
    const disciplines = [
      'Cryosphere & Glaciology',
      'Southern Ocean Dynamics & Oceanography',
      'Atmospheric & Climate Science',
      'Polar Biology & Marine Ecology',
      'Polar Geoscience & Paleogeography',
      'Space Physics & Geomagnetism'
    ];
    for (const d of disciplines) {
      if (tLower.includes(d.toLowerCase())) {
        detected.push({ id: d.toLowerCase().replace(/[^a-z0-9]/g, '_'), name: d, type: 'ScienceDiscipline' });
      }
    }

    return {
      detected_entities: detected,
      entity_count: detected.length
    };
  }
}

module.exports = new EntityExtractionService();
