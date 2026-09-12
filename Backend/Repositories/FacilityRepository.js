const BaseRepository = require('./BaseRepository');

class FacilityRepository extends BaseRepository {
  constructor() {
    super('facilities');
  }

  async findByFacilityId(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    return this.findOne({
      $or: [
        { facility_id: cleanId },
        { facility_id: cleanId.toLowerCase() },
        ...(this.toObjectId(id) ? [{ _id: this.toObjectId(id) }] : [])
      ]
    });
  }
}

module.exports = new FacilityRepository();
