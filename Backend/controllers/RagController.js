const ragService = require('../Services/RagService');
const documentService = require('../Services/DocumentService');
const vectorSearchService = require('../Services/VectorSearchService');
const { success } = require('../Utilities/responseFormatter');

class RagController {
  async query(req, res, next) {
    try {
      const { question, query, filters = {}, topK = 5 } = req.body;
      const q = question || query;
      const result = await ragService.executeRagPipeline(q, filters, parseInt(topK, 10) || 5);
      return success(res, result, 'RAG query executed with verified citations');
    } catch (err) {
      next(err);
    }
  }

  async searchVectors(req, res, next) {
    try {
      const { query, topK = 5 } = req.body;
      const chunks = await vectorSearchService.searchSimilarChunks(query, {}, parseInt(topK, 10) || 5);
      return success(res, chunks, 'Top vector similarity chunks retrieved');
    } catch (err) {
      next(err);
    }
  }

  async ingestDocument(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      const result = await documentService.ingestDocument(req.body, userId);
      return success(res, result, 'Document ingested, chunked, and vector indexed', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RagController();
