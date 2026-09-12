const BaseRepository = require('./BaseRepository');

class PublicationRepository extends BaseRepository {
  constructor() {
    super('publications');
  }

  async findByPubIdOrDoi(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    return this.findOne({
      $or: [
        { publication_id: cleanId },
        { doi: cleanId },
        ...(this.toObjectId(id) ? [{ _id: this.toObjectId(id) }] : [])
      ]
    });
  }

  async search(query, limit = 20) {
    const regex = new RegExp(query, 'i');
    return this.find({
      $or: [
        { title: regex },
        { authors: regex },
        { journal: regex },
        { abstract: regex },
        { keywords: regex },
        { disciplines: regex }
      ]
    }, { limit });
  }
}

module.exports = new PublicationRepository();
