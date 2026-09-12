const reviewRepository = require('../Repositories/ReviewRepository');

const ReviewStatus = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'PendingReview',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EDITED: 'Edited'
};

class ReviewService {
  async getReviews(query = {}) {
    const { status, content_type, limit = 50, page = 1 } = query;
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (content_type && content_type !== 'all') {
      filter.content_type = content_type;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const parsedLimit = parseInt(limit, 10);

    const [reviews, total] = await Promise.all([
      reviewRepository.find(filter, { skip, limit: parsedLimit, sort: { created_at: -1 } }),
      reviewRepository.count(filter)
    ]);

    return { reviews, total, page: parseInt(page, 10), limit: parsedLimit };
  }

  async getReviewById(id) {
    const review = await reviewRepository.findByReviewId(id);
    if (!review) {
      throw { statusCode: 404, message: `Review item not found for id: ${id}` };
    }
    return review;
  }

  async createReview(data, userId) {
    if (!data.content_type || !data.content_payload) {
      throw { statusCode: 400, message: 'content_type and content_payload are required.' };
    }

    const review_id = `REV-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const newRecord = {
      review_id,
      content_type: data.content_type,
      target_id: data.target_id || null,
      title: data.title || `Review submission for ${data.content_type}`,
      content_payload: data.content_payload,
      status: ReviewStatus.PENDING_REVIEW,
      submitted_by: userId,
      reviewer_id: null,
      comments: data.comments || '',
      created_at: now,
      updated_at: now,
      audit_history: [
        {
          action: 'CREATED',
          performed_by: userId,
          timestamp: now,
          previous_status: null,
          new_status: ReviewStatus.PENDING_REVIEW,
          comment: 'Initial submission created'
        }
      ]
    };

    return reviewRepository.insertOne(newRecord);
  }

  async updateReview(id, data, userId) {
    const review = await this.getReviewById(id);
    const now = new Date().toISOString();

    const auditEntry = {
      action: 'EDITED',
      performed_by: userId,
      timestamp: now,
      previous_status: review.status,
      new_status: ReviewStatus.EDITED,
      comment: data.comment || 'Content edited by user/reviewer'
    };

    const updateFields = {
      ...(data.content_payload ? { content_payload: data.content_payload } : {}),
      ...(data.title ? { title: data.title } : {}),
      status: ReviewStatus.EDITED
    };

    await reviewRepository.updateOne({ review_id: review.review_id }, updateFields);
    await reviewRepository.appendAuditLog(review.review_id, auditEntry);

    return this.getReviewById(id);
  }

  async approveReview(id, reviewerId, comment = '') {
    const review = await this.getReviewById(id);
    const now = new Date().toISOString();

    const auditEntry = {
      action: 'APPROVED',
      performed_by: reviewerId,
      timestamp: now,
      previous_status: review.status,
      new_status: ReviewStatus.APPROVED,
      comment: comment || 'Content verified and approved'
    };

    await reviewRepository.updateOne({ review_id: review.review_id }, {
      status: ReviewStatus.APPROVED,
      reviewer_id: reviewerId,
      reviewer_comment: comment
    });
    await reviewRepository.appendAuditLog(review.review_id, auditEntry);

    return this.getReviewById(id);
  }

  async rejectReview(id, reviewerId, comment = '') {
    const review = await this.getReviewById(id);
    const now = new Date().toISOString();

    const auditEntry = {
      action: 'REJECTED',
      performed_by: reviewerId,
      timestamp: now,
      previous_status: review.status,
      new_status: ReviewStatus.REJECTED,
      comment: comment || 'Content rejected during review'
    };

    await reviewRepository.updateOne({ review_id: review.review_id }, {
      status: ReviewStatus.REJECTED,
      reviewer_id: reviewerId,
      reviewer_comment: comment
    });
    await reviewRepository.appendAuditLog(review.review_id, auditEntry);

    return this.getReviewById(id);
  }
}

module.exports = new ReviewService();
