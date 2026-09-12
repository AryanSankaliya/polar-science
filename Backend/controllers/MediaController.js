const mediaService = require('../Services/MediaService');
const { success, paginated } = require('../Utilities/responseFormatter');

class MediaController {
  async getMedia(req, res, next) {
    try {
      const result = await mediaService.getMedia(req.query);
      return paginated(res, result.media, result.total, result.page, result.limit, 'Media gallery records retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getMediaById(req, res, next) {
    try {
      const item = await mediaService.getMediaById(req.params.id);
      return success(res, item, 'Media item details retrieved');
    } catch (err) {
      next(err);
    }
  }

  async searchMedia(req, res, next) {
    try {
      const q = req.query.q || '';
      const items = await mediaService.searchMedia(q);
      return success(res, items, 'Media search results');
    } catch (err) {
      next(err);
    }
  }

  async createMedia(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      const result = await mediaService.createMedia(req.body, userId);
      return success(res, result, 'Media metadata created successfully', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MediaController();
