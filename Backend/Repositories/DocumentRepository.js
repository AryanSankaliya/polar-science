const BaseRepository = require('./BaseRepository');

class DocumentRepository extends BaseRepository {
  constructor() {
    super('documents');
  }

  async findByDocId(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    return this.findOne({
      $or: [
        { document_id: cleanId },
        { id: cleanId },
        ...(this.toObjectId(id) ? [{ _id: this.toObjectId(id) }] : [])
      ]
    });
  }

  async search(query, limit = 20) {
    const regex = new RegExp(query, 'i');
    return this.find({
      $or: [
        { title: regex },
        { description: regex },
        { author: regex },
        { doc_type: regex },
        { keywords: regex }
      ]
    }, { limit });
  }
}

module.exports = new DocumentRepository();
