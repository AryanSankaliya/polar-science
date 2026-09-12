const knowledgeGraphService = require('../Services/KnowledgeGraphService');
const { success } = require('../Utilities/responseFormatter');

class KnowledgeController {
  async getGraph(req, res, next) {
    try {
      const graph = await knowledgeGraphService.getGraph(req.query);
      return success(res, graph, 'Knowledge graph structure (nodes and edges) retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getEntities(req, res, next) {
    try {
      const entities = await knowledgeGraphService.getEntities(req.query.type);
      return success(res, entities, 'Knowledge entities retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getEntityDetails(req, res, next) {
    try {
      const details = await knowledgeGraphService.getEntityDetails(req.params.id);
      return success(res, details, 'Knowledge entity details and relationships retrieved');
    } catch (err) {
      next(err);
    }
  }

  async createRelation(req, res, next) {
    try {
      const { sourceId, targetId, label, type } = req.body;
      const result = await knowledgeGraphService.createRelation(sourceId, targetId, label, type);
      return success(res, result, 'Relationship edge created successfully', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new KnowledgeController();
