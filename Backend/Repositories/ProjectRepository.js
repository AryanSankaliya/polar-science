const BaseRepository = require('./BaseRepository');

class ProjectRepository extends BaseRepository {
  constructor() {
    super('projects');
  }

  async findByCodeOrId(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    return this.findOne({
      $or: [
        { project_code: cleanId },
        { project_code: cleanId.toUpperCase() },
        ...(this.toObjectId(id) ? [{ _id: this.toObjectId(id) }] : [])
      ]
    });
  }

  async findByResearcher(researcherId) {
    return this.find({
      $or: [
        { lead_researcher_id: researcherId },
        { co_researchers: researcherId }
      ]
    });
  }

  async findByStation(stationId) {
    return this.find({ station_ids: stationId });
  }

  async search(query, limit = 20) {
    const regex = new RegExp(query, 'i');
    return this.find({
      $or: [
        { project_code: regex },
        { title: regex },
        { description: regex },
        { science_disciplines: regex },
        { lead_researcher_name: regex }
      ]
    }, { limit });
  }
}

module.exports = new ProjectRepository();
