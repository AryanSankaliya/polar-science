const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  async findByEmail(email) {
    if (!email) return null;
    return this.findOne({ email: email.toLowerCase().trim() });
  }

  async addRefreshToken(userId, token) {
    const objId = this.toObjectId(userId);
    return this.collection.updateOne(
      { _id: objId },
      { $push: { refresh_tokens: { token, created_at: new Date().toISOString() } } }
    );
  }

  async removeRefreshToken(userId, token) {
    const objId = this.toObjectId(userId);
    return this.collection.updateOne(
      { _id: objId },
      { $pull: { refresh_tokens: { token } } }
    );
  }

  async updatePassword(userId, newPasswordHash) {
    const objId = this.toObjectId(userId);
    return this.updateOne(
      { _id: objId },
      { password_hash: newPasswordHash, password_updated_at: new Date().toISOString() }
    );
  }
}

module.exports = new UserRepository();
