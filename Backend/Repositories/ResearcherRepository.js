const BaseRepository = require('./BaseRepository');

class ResearcherRepository extends BaseRepository {
  constructor() {
    super('researchers');
  }

  async findBySlugOrId(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    return this.findOne({
      $or: [
        { researcher_id: cleanId },
        { researcher_id: cleanId.toLowerCase() },
        { name: { $regex: `^${cleanId}$`, $options: 'i' } },
        ...(this.toObjectId(id) ? [{ _id: this.toObjectId(id) }] : [])
      ]
    });
  }

  async search(query, limit = 20) {
    const regex = new RegExp(query, 'i');
    return this.find({
      $or: [
        { name: regex },
        { institution: regex },
        { designation: regex },
        { research_interests: regex },
        { disciplines: regex }
      ]
    }, { limit });
  }
}

module.exports = new ResearcherRepository();
