const BaseRepository = require('./BaseRepository');

class ReviewRepository extends BaseRepository {
  constructor() {
    super('reviews');
  }

  async findByReviewId(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    return this.findOne({
      $or: [
        { review_id: cleanId },
        { id: cleanId },
        ...(this.toObjectId(id) ? [{ _id: this.toObjectId(id) }] : [])
      ]
    });
  }

  async appendAuditLog(reviewId, auditEntry) {
    const objId = this.toObjectId(reviewId);
    return this.collection.updateOne(
      { $or: [{ _id: objId }, { review_id: reviewId }] },
      {
        $push: { audit_history: auditEntry },
        $set: { updated_at: new Date().toISOString() }
      }
    );
  }
}

module.exports = new ReviewRepository();
