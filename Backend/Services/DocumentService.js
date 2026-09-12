const documentRepository = require('../Repositories/DocumentRepository');
const { chunkText, extractKeywords } = require('../Utilities/textProcessor');
const { generateDeterministicEmbedding } = require('../Utilities/vectorMath');
const { getDb } = require('../Configuration/database');

class DocumentService {
  async getDocuments(query = {}) {
    const { search, doc_type, limit = 50, page = 1 } = query;
    const filter = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { description: regex },
        { author: regex },
        { keywords: regex }
      ];
    }
    if (doc_type && doc_type.trim()) {
      filter.doc_type = { $regex: doc_type.trim(), $options: 'i' };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const parsedLimit = parseInt(limit, 10);

    const [documents, total] = await Promise.all([
      documentRepository.find(filter, { skip, limit: parsedLimit, sort: { year: -1 } }),
      documentRepository.count(filter)
    ]);

    return { documents, total, page: parseInt(page, 10), limit: parsedLimit };
  }

  async getDocumentById(id) {
    const doc = await documentRepository.findByDocId(id);
    if (!doc) {
      throw { statusCode: 404, message: `Document not found for id: ${id}` };
    }
    return doc;
  }

  async getDocumentChunks(id) {
    const doc = await this.getDocumentById(id);
    const db = getDb();
    const docId = doc.document_id || doc.id || id;
    return db.collection('expedition_chunks').find({
      $or: [
        { document_id: docId },
        { source_document: doc.title }
      ]
    }).toArray();
  }

  async ingestDocument(docData, userId) {
    const { title, doc_type, content, author, year, station_id, expedition_id } = docData;
    if (!title || !content) {
      throw { statusCode: 400, message: 'Document title and content text are required.' };
    }

    const document_id = `DOC-${Date.now().toString().slice(-6)}`;
    const chunks = chunkText(content, 800, 100);
    const keywords = extractKeywords(content, 10);

    const docRecord = {
      document_id,
      title,
      doc_type: doc_type || 'Research Report',
      author: author || 'NCPOR Scientist',
      year: year ? parseInt(year, 10) : new Date().getFullYear(),
      station_id: station_id || null,
      expedition_id: expedition_id || null,
      keywords,
      processing_status: 'Indexed',
      chunk_count: chunks.length,
      created_by: userId
    };

    const insertedDoc = await documentRepository.insertOne(docRecord);

    // Save individual chunks for RAG vector search
    const db = getDb();
    const chunkDocs = chunks.map((c, idx) => ({
      chunk_id: `${document_id}_chk_${idx + 1}`,
      document_id,
      source_document: title,
      page: idx + 1,
      page_number: idx + 1,
      chunk_text: c.text,
      embedding: generateDeterministicEmbedding(c.text, 128),
      created_at: new Date().toISOString()
    }));

    if (chunkDocs.length > 0) {
      await db.collection('expedition_chunks').insertMany(chunkDocs);
    }

    return {
      document: insertedDoc,
      chunks_indexed: chunkDocs.length
    };
  }
}

module.exports = new DocumentService();
