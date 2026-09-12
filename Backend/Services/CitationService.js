/**
 * Interface ICitationService
 * Formats verifiable scientific and archival citations for retrieved evidence.
 */
class CitationService {
  /**
   * Formats exact citation string for a chunk.
   * Format: [Source: <Title>, Page <PageNum>]
   */
  formatChunkCitation(chunk) {
    const doc = chunk.source_document || chunk.document_id || 'NCPOR Archive';
    const page = chunk.page !== undefined ? chunk.page : (chunk.page_number || 1);
    return `[Source: ${doc}, Page ${page}]`;
  }

  /**
   * Generates a structured list of unique citations with metadata and excerpts.
   */
  buildCitationsList(chunks) {
    if (!Array.isArray(chunks) || chunks.length === 0) {
      return [];
    }

    const citations = [];
    const seen = new Set();

    for (const c of chunks) {
      const tag = this.formatChunkCitation(c);
      if (!seen.has(tag)) {
        seen.add(tag);
        citations.push({
          citation_tag: tag,
          source_document: c.source_document || c.document_id,
          page_number: c.page || c.page_number || 1,
          chunk_id: c.chunk_id,
          excerpt: c.chunk_text ? c.chunk_text.slice(0, 200).trim() + '...' : ''
        });
      }
    }

    return citations;
  }
}

module.exports = new CitationService();
