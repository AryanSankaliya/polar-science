const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

/**
 * GET /api/v1/outreach
 * Retrieves polar outreach & educational records with optional category & search filters.
 * Query Parameters:
 *  - category: Filter by exact category (e.g. 'Fauna & Wildlife')
 *  - search: Full-text or keyword search query
 *  - limit: Number of records to return (default: 100)
 */
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection('outreach_records');

    const { category, search, limit } = req.query;
    const query = {};

    // Filter by Category
    if (category && category !== 'All' && category.trim()) {
      query.category = category.trim();
    }

    // Filter by Search Term (MongoDB $text search with regex fallback)
    if (search && search.trim()) {
      const searchTerm = search.trim();
      try {
        query.$text = { $search: searchTerm };
      } catch (err) {
        query.title = { $regex: searchTerm, $options: 'i' };
      }
    }

    const maxLimit = parseInt(limit, 10) || 100;

    let cursor = collection.find(query);

    // If text search was used, sort by relevance score
    if (query.$text) {
      cursor = cursor.project({ score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } });
    } else {
      cursor = cursor.sort({ id: 1 });
    }

    const [data, totalCount, categories] = await Promise.all([
      cursor.limit(maxLimit).toArray(),
      collection.countDocuments(query),
      collection.distinct('category')
    ]);

    // Fallback if text search yielded 0 items: try case-insensitive regex on title/desc
    if (data.length === 0 && search && search.trim()) {
      const regexQuery = {
        ...(category && category !== 'All' ? { category: category.trim() } : {}),
        $or: [
          { title: { $regex: search.trim(), $options: 'i' } },
          { description: { $regex: search.trim(), $options: 'i' } },
          { scientific_fact: { $regex: search.trim(), $options: 'i' } },
          { tags: { $in: [new RegExp(search.trim(), 'i')] } }
        ]
      };
      const fallbackData = await collection.find(regexQuery).limit(maxLimit).toArray();
      const fallbackCount = await collection.countDocuments(regexQuery);

      return res.status(200).json({
        success: true,
        total_records: fallbackCount,
        categories: ['All', ...categories.sort()],
        data: fallbackData
      });
    }

    return res.status(200).json({
      success: true,
      total_records: totalCount,
      categories: ['All', ...categories.sort()],
      data
    });
  } catch (error) {
    console.error('[ERROR] Error fetching outreach records:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve outreach records from database',
      error: error.message
    });
  }
});

module.exports = router;
