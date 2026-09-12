const BaseRepository = require('./BaseRepository');

class ScienceRepository extends BaseRepository {
  constructor() {
    super('science_areas');
  }

  async findByDisciplineId(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    return this.findOne({
      $or: [
        { discipline_id: cleanId },
        { discipline_id: cleanId.toLowerCase() },
        { name: { $regex: `^${cleanId}$`, $options: 'i' } },
        ...(this.toObjectId(id) ? [{ _id: this.toObjectId(id) }] : [])
      ]
    });
  }
}

module.exports = new ScienceRepository();
