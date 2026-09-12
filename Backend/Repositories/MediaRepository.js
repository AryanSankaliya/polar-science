const BaseRepository = require('./BaseRepository');

class MediaRepository extends BaseRepository {
  constructor() {
    super('media_gallery');
  }

  async findBySlugOrId(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    return this.findOne({
      $or: [
        { id: cleanId },
        { id: cleanId.toLowerCase() },
        ...(this.toObjectId(id) ? [{ _id: this.toObjectId(id) }] : [])
      ]
    });
  }

  async search(query, limit = 50) {
    const regex = new RegExp(query, 'i');
    return this.find({
      $or: [
        { title: regex },
        { description: regex },
        { location: regex },
        { category: regex },
        { tags: { $in: [regex] } }
      ]
    }, { limit });
  }
}

module.exports = new MediaRepository();
