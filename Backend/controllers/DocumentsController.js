const documentService = require('../Services/DocumentService');
const { success, paginated } = require('../Utilities/responseFormatter');

class DocumentsController {
  async getDocuments(req, res, next) {
    try {
      const result = await documentService.getDocuments(req.query);
      return paginated(res, result.documents, result.total, result.page, result.limit, 'Documents retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  async getDocumentById(req, res, next) {
    try {
      const doc = await documentService.getDocumentById(req.params.id);
      return success(res, doc, 'Document details retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getChunks(req, res, next) {
    try {
      const chunks = await documentService.getDocumentChunks(req.params.id);
      return success(res, chunks, 'Document chunks retrieved');
    } catch (err) {
      next(err);
    }
  }

  async ingestDocument(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      const result = await documentService.ingestDocument(req.body, userId);
      return success(res, result, 'Document ingested and indexed for RAG vector search', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DocumentsController();
