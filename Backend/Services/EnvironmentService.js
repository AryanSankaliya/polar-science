const environmentRepository = require('../Repositories/EnvironmentRepository');

class EnvironmentService {
  async getRecords(query = {}) {
    const { category, search } = query;
    const filter = {};
    if (category && category.trim()) {
      filter.category = { $regex: category.trim(), $options: 'i' };
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { summary: regex },
        { details: regex }
      ];
    }
    return environmentRepository.find(filter, { sort: { year: 1 } });
  }

  async getRecordById(id) {
    const record = await environmentRepository.findByRecordId(id);
    if (!record) {
      throw { statusCode: 404, message: `Environmental record not found for id: ${id}` };
    }
    return record;
  }

  async getTreatyInfo() {
    return environmentRepository.findByCategory('Antarctic Treaty System');
  }

  async getProtectedAreas() {
    return environmentRepository.findByCategory('Protected Areas');
  }

  async getGuidelines() {
    return environmentRepository.findByCategory('Guidelines');
  }
}

module.exports = new EnvironmentService();
