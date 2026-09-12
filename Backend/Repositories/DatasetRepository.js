const BaseRepository = require('./BaseRepository');

class DatasetRepository extends BaseRepository {
  constructor() {
    super('datasets');
  }

  async findByDatasetId(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    return this.findOne({
      $or: [
        { dataset_id: cleanId },
        { dataset_id: cleanId.toLowerCase() },
        ...(this.toObjectId(id) ? [{ _id: this.toObjectId(id) }] : [])
      ]
    });
  }

  async search(query, limit = 20) {
    const regex = new RegExp(query, 'i');
    return this.find({
      $or: [
        { dataset_id: regex },
        { title: regex },
        { description: regex },
        { discipline: regex },
        { parameters: regex },
        { source: regex },
        { location: regex }
      ]
    }, { limit });
  }
}

module.exports = new DatasetRepository();
