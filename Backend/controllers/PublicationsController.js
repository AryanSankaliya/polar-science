const publicationService = require('../Services/PublicationService');
const { success, paginated } = require('../Utilities/responseFormatter');

class PublicationsController {
  async getPublications(req, res, next) {
    try {
      const result = await publicationService.getPublications(req.query);
      return paginated(res, result.publications, result.total, result.page, result.limit, 'Publications retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getPublicationById(req, res, next) {
    try {
      const pub = await publicationService.getPublicationById(req.params.id);
      return success(res, pub, 'Publication details retrieved');
    } catch (err) {
      next(err);
    }
  }

  async searchPublications(req, res, next) {
    try {
      const q = req.query.q || '';
      const publications = await publicationService.searchPublications(q);
      return success(res, publications, 'Publication search results');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PublicationsController();
