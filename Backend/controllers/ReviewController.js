const reviewService = require('../Services/ReviewService');
const { success, paginated } = require('../Utilities/responseFormatter');

class ReviewController {
  async getReviews(req, res, next) {
    try {
      const result = await reviewService.getReviews(req.query);
      return paginated(res, result.reviews, result.total, result.page, result.limit, 'Review items retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getReviewById(req, res, next) {
    try {
      const review = await reviewService.getReviewById(req.params.id);
      return success(res, review, 'Review details retrieved');
    } catch (err) {
      next(err);
    }
  }

  async createReview(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 'anonymous';
      const review = await reviewService.createReview(req.body, userId);
      return success(res, review, 'Review submission created successfully', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateReview(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 'anonymous';
      const updated = await reviewService.updateReview(req.params.id, req.body, userId);
      return success(res, updated, 'Review updated successfully');
    } catch (err) {
      next(err);
    }
  }

  async approveReview(req, res, next) {
    try {
      const reviewerId = req.user ? req.user.id : 'reviewer';
      const comment = req.body.comment || '';
      const approved = await reviewService.approveReview(req.params.id, reviewerId, comment);
      return success(res, approved, 'Review item approved');
    } catch (err) {
      next(err);
    }
  }

  async rejectReview(req, res, next) {
    try {
      const reviewerId = req.user ? req.user.id : 'reviewer';
      const comment = req.body.comment || '';
      const rejected = await reviewService.rejectReview(req.params.id, reviewerId, comment);
      return success(res, rejected, 'Review item rejected');
    } catch (err) {
      next(err);
    }
  }

  async editReview(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 'editor';
      const edited = await reviewService.updateReview(req.params.id, req.body, userId);
      return success(res, edited, 'Review content edited');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReviewController();
