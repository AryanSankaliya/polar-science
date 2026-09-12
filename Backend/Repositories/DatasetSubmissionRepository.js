const BaseRepository = require('./BaseRepository');

class DatasetSubmissionRepository extends BaseRepository {
  constructor() {
    super('dataset_submissions');
  }

  async findPending() {
    return this.find({ status: 'pending' }, { sort: { created_at: -1 } });
  }

  async findByStatus(status) {
    if (!status || status === 'all') {
      return this.find({}, { sort: { created_at: -1 } });
    }
    return this.find({ status: status.toLowerCase() }, { sort: { created_at: -1 } });
  }

  async findSubmissionById(id) {
    if (!id) return null;
    const cleanId = String(id).trim();
    const objId = this.toObjectId(cleanId);
    return this.findOne({
      $or: [
        { submission_id: cleanId },
        { id: cleanId },
        ...(objId ? [{ _id: objId }] : [])
      ]
    });
  }
}

module.exports = new DatasetSubmissionRepository();
