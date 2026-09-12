const datasetService = require('../Services/DatasetService');
const { success, paginated } = require('../Utilities/responseFormatter');

class DatasetsController {
  async getDatasets(req, res, next) {
    try {
      const result = await datasetService.getDatasets(req.query);
      return paginated(res, result.datasets, result.total, result.page, result.limit, 'Datasets retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getDatasetById(req, res, next) {
    try {
      const dataset = await datasetService.getDatasetById(req.params.id);
      return success(res, dataset, 'Dataset details retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getMetadata(req, res, next) {
    try {
      const metadata = await datasetService.getDatasetMetadata(req.params.id);
      return success(res, metadata, 'Dataset metadata retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getRelated(req, res, next) {
    try {
      const related = await datasetService.getRelatedDatasets(req.params.id);
      return success(res, related, 'Related datasets retrieved');
    } catch (err) {
      next(err);
    }
  }

  async searchDatasets(req, res, next) {
    try {
      const q = req.query.q || '';
      const datasets = await datasetService.searchDatasets(q);
      return success(res, datasets, 'Dataset search results');
    } catch (err) {
      next(err);
    }
  }

  async submitDataset(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      const result = await datasetService.submitDataset(req.body, userId);
      return success(res, result, 'Dataset submitted successfully for review', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DatasetsController();
