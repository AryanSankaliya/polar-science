const { getDb } = require('../Configuration/database');
const BaseRepository = require('./BaseRepository');

class KnowledgeRepository extends BaseRepository {
  constructor() {
    super('knowledge_nodes');
  }

  get edgesCollection() {
    return getDb().collection('knowledge_edges');
  }

  async getAllNodes(filter = {}) {
    const docs = await this.collection.find(filter).toArray();
    return docs.map(d => this.sanitizeDoc(d));
  }

  async getAllEdges(filter = {}) {
    const docs = await this.edgesCollection.find(filter).toArray();
    return docs.map(d => this.sanitizeDoc(d));
  }

  async findNodeById(nodeId) {
    const doc = await this.collection.findOne({
      $or: [
        { id: nodeId },
        { node_id: nodeId },
        { entity_id: nodeId }
      ]
    });
    return this.sanitizeDoc(doc);
  }

  async findAdjacentEdges(nodeId) {
    const docs = await this.edgesCollection.find({
      $or: [
        { source: nodeId },
        { target: nodeId },
        { source_id: nodeId },
        { target_id: nodeId }
      ]
    }).toArray();
    return docs.map(d => this.sanitizeDoc(d));
  }

  async insertEdge(edge) {
    const now = new Date().toISOString();
    const result = await this.edgesCollection.insertOne({
      ...edge,
      created_at: now
    });
    return this.sanitizeDoc({ ...edge, id: result.insertedId.toString() });
  }
}

module.exports = new KnowledgeRepository();

