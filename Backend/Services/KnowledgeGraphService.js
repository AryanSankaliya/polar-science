const knowledgeRepository = require('../Repositories/KnowledgeRepository');

class KnowledgeGraphService {
  async getGraph(filters = {}) {
    const { type, group } = filters;
    const nodeFilter = {};
    if (type) nodeFilter.type = type;
    if (group) nodeFilter.group = group;

    const [nodes, edges] = await Promise.all([
      knowledgeRepository.getAllNodes(nodeFilter),
      knowledgeRepository.getAllEdges({})
    ]);

    // Format for frontend graph visualization libraries (Cytoscape, D3, Vis.js, ReactFlow)
    const formattedNodes = nodes.map(n => ({
      id: n.id || n.node_id,
      label: n.label || n.name || n.id,
      type: n.type || 'Entity',
      group: n.group || 'General',
      properties: n.properties || {}
    }));

    const validNodeIds = new Set(formattedNodes.map(n => n.id));

    // Filter edges to only include those between active nodes
    const formattedEdges = edges
      .filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target))
      .map((e, idx) => ({
        id: e.id || `edge_${idx + 1}`,
        source: e.source,
        target: e.target,
        label: e.label || e.relation || 'RELATES_TO',
        type: e.type || 'DIRECTED'
      }));

    return {
      nodes_count: formattedNodes.length,
      edges_count: formattedEdges.length,
      nodes: formattedNodes,
      edges: formattedEdges
    };
  }

  async getEntities(type = null) {
    const filter = type ? { type } : {};
    return knowledgeRepository.getAllNodes(filter);
  }

  async getEntityDetails(id) {
    const node = await knowledgeRepository.findNodeById(id);
    if (!node) {
      throw { statusCode: 404, message: `Knowledge entity not found for id: ${id}` };
    }
    const adjacentEdges = await knowledgeRepository.findAdjacentEdges(id);
    return {
      node,
      adjacent_relations: adjacentEdges
    };
  }

  async createRelation(sourceId, targetId, label, type = 'DIRECTED') {
    if (!sourceId || !targetId || !label) {
      throw { statusCode: 400, message: 'sourceId, targetId, and label are required.' };
    }
    return knowledgeRepository.insertEdge({
      source: sourceId,
      target: targetId,
      label,
      type
    });
  }
}

module.exports = new KnowledgeGraphService();
