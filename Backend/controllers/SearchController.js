const searchService = require('../Services/SearchService');
const { success } = require('../Utilities/responseFormatter');

class SearchController {
  async search(req, res, next) {
    try {
      const q = req.query.q || req.query.query || '';
      const results = await searchService.globalSearch(q, req.query);
      return success(res, results, 'Global search results retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SearchController();
