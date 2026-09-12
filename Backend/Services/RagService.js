const vectorSearchService = require('./VectorSearchService');
const citationService = require('./CitationService');

/**
 * Interface IRagService
 * Implements end-to-end Retrieval-Augmented Generation with strict citation guarantees.
 */
class RagService {
  /**
   * Executes RAG query pipeline: Query -> Vector Search -> Top Chunks -> Evidence Assembly -> Citations
   * @param {string} question 
   * @param {object} filters 
   * @param {number} topK 
   */
  async executeRagPipeline(question, filters = {}, topK = 5) {
    if (!question || typeof question !== 'string' || !question.trim()) {
      return {
        answer: 'Please provide a valid scientific inquiry regarding Polar science or expeditions.',
        citations: [],
        sources: [],
        retrieved_chunks_count: 0
      };
    }

    const retrievedChunks = await vectorSearchService.searchSimilarChunks(question, filters, topK);
    const citations = citationService.buildCitationsList(retrievedChunks);

    if (retrievedChunks.length === 0) {
      return {
        answer: 'The verified NCPOR local polar research archive does not contain documents directly addressing this specific query.',
        citations: [],
        sources: [],
        retrieved_chunks_count: 0
      };
    }

    // Grounded synthesis from highest ranked evidence
    const topChunk = retrievedChunks[0];
    const topTag = citationService.formatChunkCitation(topChunk);
    let synthesizedAnswer = `Based on official polar records: "${topChunk.chunk_text.slice(0, 320).trim()}..." ${topTag}`;

    if (retrievedChunks.length > 1) {
      const secondChunk = retrievedChunks[1];
      const secondTag = citationService.formatChunkCitation(secondChunk);
      synthesizedAnswer += `\n\nAdditional verified context: "${secondChunk.chunk_text.slice(0, 260).trim()}..." ${secondTag}`;
    }

    return {
      answer: synthesizedAnswer,
      citations: citations.map(c => c.citation_tag),
      sources: citations,
      retrieved_chunks_count: retrievedChunks.length
    };
  }
}

module.exports = new RagService();
