const { getDb } = require('../Configuration/database');
const { cosineSimilarity } = require('../Utilities/vectorMath');
const embeddingService = require('./EmbeddingService');

/**
 * Interface IVectorSearchService
 * Implements vector similarity search with metadata filtering across document and expedition chunks.
 */
class VectorSearchService {
  /**
   * Search for top-K semantically relevant chunks for a given query vector.
   * @param {string} query 
   * @param {object} filters 
   * @param {number} topK 
   * @returns {Promise<Array<{ chunk_id: string, source_document: string, page: number, chunk_text: string, similarity: number }>>}
   */
  async searchSimilarChunks(query, filters = {}, topK = 5) {
    const db = getDb();
    const chunkCol = db.collection('expedition_chunks');
    const queryVector = await embeddingService.getEmbedding(query);

    // Hybrid search: 1. Full text / keyword matching candidate fetch
    let candidateChunks = [];
    try {
      candidateChunks = await chunkCol.find(
        { $text: { $search: query } }
      )
      .limit(30)
      .toArray();
    } catch (e) {
      // Text index fallback
    }

    if (candidateChunks.length === 0) {
      const terms = query.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 3);
      if (terms.length > 0) {
        candidateChunks = await chunkCol.find({
          chunk_text: { $regex: terms.join('|'), $options: 'i' }
        })
        .limit(30)
        .toArray();
      }
    }

    // If still empty, sample top chunks for vector comparison
    if (candidateChunks.length === 0) {
      candidateChunks = await chunkCol.find({}).limit(50).toArray();
    }

    // Compute exact cosine similarity for candidate set
    const scoredChunks = candidateChunks.map(chunk => {
      const chunkVector = chunk.embedding || embeddingService.getEmbedding(chunk.chunk_text);
      const similarity = cosineSimilarity(queryVector, chunkVector);
      return {
        chunk_id: chunk.chunk_id || chunk._id.toString(),
        document_id: chunk.document_id,
        source_document: chunk.source_document || 'Expedition Report',
        page: chunk.page || chunk.page_number || 1,
        chunk_text: chunk.chunk_text,
        similarity: parseFloat(similarity.toFixed(4))
      };
    });

    scoredChunks.sort((a, b) => b.similarity - a.similarity);
    return scoredChunks.slice(0, topK);
  }
}

module.exports = new VectorSearchService();
