const BaseRepository = require('./BaseRepository');

class StationRepository extends BaseRepository {
  constructor() {
    super('stations');
  }

  async findBySlugOrId(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    return this.findOne({
      $or: [
        { station_id: cleanId.toLowerCase() },
        { station_id: cleanId },
        { name: { $regex: `^${cleanId}$`, $options: 'i' } },
        ...(this.toObjectId(id) ? [{ _id: this.toObjectId(id) }] : [])
      ]
    });
  }

  async findIndianStations() {
    return this.find({ is_indian_station: true }, { sort: { established_year: 1 } });
  }

  async findByRegion(region) {
    return this.find({ region: { $regex: `^${region}$`, $options: 'i' } });
  }
}

module.exports = new StationRepository();
