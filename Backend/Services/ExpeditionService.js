const expeditionRepository = require('../Repositories/ExpeditionRepository');
const researcherRepository = require('../Repositories/ResearcherRepository');
const stationRepository = require('../Repositories/StationRepository');
const projectRepository = require('../Repositories/ProjectRepository');

function parseYear(yearStr) {
  if (!yearStr) return 0;
  const match = String(yearStr).match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : 0;
}

function parseExpeditionNum(numStr) {
  if (!numStr) return 0;
  const match = String(numStr).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

class ExpeditionService {
  async getExpeditions(query = {}) {
    const { vessel, year, search, station, limit = 100, page = 1 } = query;
    const andConditions = [];

    if (vessel && vessel.trim()) {
      andConditions.push({ vessel: { $regex: vessel.trim(), $options: 'i' } });
    }
    if (year && year.trim()) {
      andConditions.push({
        $or: [
          { operational_year: { $regex: year.trim(), $options: 'i' } },
          { season: { $regex: year.trim(), $options: 'i' } }
        ]
      });
    }
    if (station && station.trim()) {
      andConditions.push({ ports: { $regex: station.trim(), $options: 'i' } });
    }
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      andConditions.push({
        $or: [
          { expedition_number: searchRegex },
          { expedition_title: searchRegex },
          { vessel: searchRegex },
          { operational_year: searchRegex },
          { route: searchRegex },
          { ports: searchRegex },
          { operational_highlights: searchRegex },
          { environmental_summary: searchRegex },
          { source_document: searchRegex }
        ]
      });
    }

    const filter = andConditions.length > 0 ? { $and: andConditions } : {};
    const rawRecords = await expeditionRepository.find(filter);

    // Chronological & Expedition Number Sorting
    rawRecords.sort((a, b) => {
      const yearA = parseYear(a.operational_year);
      const yearB = parseYear(b.operational_year);
      if (yearB !== yearA) return yearB - yearA;
      const numA = parseExpeditionNum(a.expedition_number);
      const numB = parseExpeditionNum(b.expedition_number);
      if (numB !== numA) return numB - numA;
      return (a.document_id || '').localeCompare(b.document_id || '');
    });

    const vesselsSet = new Set();
    const stationsSet = new Set();
    for (const rec of rawRecords) {
      if (Array.isArray(rec.vessel)) rec.vessel.forEach(v => v && vesselsSet.add(v.trim()));
      else if (typeof rec.vessel === 'string' && rec.vessel) vesselsSet.add(rec.vessel.trim());
      if (Array.isArray(rec.ports)) rec.ports.forEach(p => p && stationsSet.add(p.trim()));
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const paginatedRecords = rawRecords.slice(skip, skip + parseInt(limit, 10));

    return {
      expeditions: paginatedRecords,
      total: rawRecords.length,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      stats: {
        total_expeditions_tracked: rawRecords.length,
        unique_vessels_used: vesselsSet.size,
        stations_covered: stationsSet.size
      }
    };
  }

  async getExpeditionById(id) {
    const expedition = await expeditionRepository.findExpeditionById(id);
    if (!expedition) {
      throw { statusCode: 404, message: `Expedition record not found for id: ${id}` };
    }
    const chunks = await expeditionRepository.findChunksForExpedition(expedition);
    return {
      ...expedition,
      chunks
    };
  }

  async getExpeditionTimeline() {
    const all = await expeditionRepository.find({});
    all.sort((a, b) => {
      const yearA = parseYear(a.operational_year);
      const yearB = parseYear(b.operational_year);
      return yearA - yearB; // Chronological ascending for timeline
    });

    return all.map(exp => ({
      expedition_number: exp.expedition_number,
      document_id: exp.document_id,
      title: exp.expedition_title,
      year: parseYear(exp.operational_year),
      operational_year: exp.operational_year,
      vessel: exp.vessel,
      ports: exp.ports,
      leaders: exp.leaders,
      highlights: exp.operational_highlights,
      scientific_objectives: exp.scientific_activities || []
    }));
  }

  async getResearchersForExpedition(id) {
    const expedition = await this.getExpeditionById(id);
    const expNum = expedition.expedition_number || id;
    const docId = expedition.document_id;
    return researcherRepository.find({
      $or: [
        { expeditions: expNum },
        { expeditions: docId }
      ]
    });
  }

  async getStationsForExpedition(id) {
    const expedition = await this.getExpeditionById(id);
    const ports = Array.isArray(expedition.ports) ? expedition.ports : [expedition.ports];
    return stationRepository.find({
      $or: ports.map(p => ({ name: { $regex: p, $options: 'i' } }))
    });
  }

  async getProjectsForExpedition(id) {
    const expedition = await this.getExpeditionById(id);
    const expNum = expedition.expedition_number || id;
    const docId = expedition.document_id;
    return projectRepository.find({
      $or: [
        { expedition_ids: expNum },
        { expedition_ids: docId }
      ]
    });
  }

  async getReportsForExpedition(id) {
    const expedition = await this.getExpeditionById(id);
    return expeditionRepository.findChunksForExpedition(expedition);
  }
}

module.exports = new ExpeditionService();
