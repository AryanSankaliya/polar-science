const BaseRepository = require('./BaseRepository');
const { getDb } = require('../Configuration/database');

class ExpeditionRepository extends BaseRepository {
  constructor() {
    super('expeditions');
  }

  get chunksCollection() {
    return getDb().collection('expedition_chunks');
  }

  async findExpeditionById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    return this.findOne({
      $or: [
        { document_id: cleanId },
        { expedition_number: cleanId },
        ...(this.toObjectId(id) ? [{ _id: this.toObjectId(id) }] : [])
      ]
    });
  }

  async findChunksForExpedition(expedition) {
    if (!expedition) return [];
    return this.chunksCollection.find({
      $or: [
        { document_id: expedition.document_id },
        { source_document: expedition.source_document }
      ]
    })
    .sort({ page: 1, chunk_id: 1 })
    .limit(100)
    .toArray();
  }

  async searchChunks(query, limit = 5) {
    try {
      return await this.chunksCollection.find(
        { $text: { $search: query } },
        { projection: { score: { $meta: 'textScore' } } }
      )
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .toArray();
    } catch (e) {
      // Fallback regex if text index missing
      const regex = new RegExp(query.replace(/[^a-zA-Z0-9\s]/g, ' '), 'i');
      return this.chunksCollection.find({ chunk_text: regex }).limit(limit).toArray();
    }
  }
}

module.exports = new ExpeditionRepository();
