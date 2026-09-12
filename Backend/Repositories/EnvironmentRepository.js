const BaseRepository = require('./BaseRepository');

class EnvironmentRepository extends BaseRepository {
  constructor() {
    super('environmental_records');
  }

  async findByRecordId(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    return this.findOne({
      $or: [
        { record_id: cleanId },
        { record_id: cleanId.toLowerCase() },
        ...(this.toObjectId(id) ? [{ _id: this.toObjectId(id) }] : [])
      ]
    });
  }

  async findByCategory(category) {
    return this.find({ category: { $regex: category, $options: 'i' } });
  }
}

module.exports = new EnvironmentRepository();
