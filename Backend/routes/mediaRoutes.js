const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

/**
 * GET /api/v1/media
 * Retrieves multimedia gallery records (images and videos) with category, type, and search filters.
 * Query Parameters:
 *  - category: Filter by category (e.g. 'Research Stations', 'Polar Wildlife', 'Cryosphere & Landscapes', 'Outreach Documentaries')
 *  - type: Filter by media type ('image' | 'video')
 *  - search: Search text query on title, description, or tags
 *  - limit: Max items to return (default: 100)
 */
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection('media_gallery');

    const { category, type, search, limit } = req.query;
    const query = {};

    // Filter by Category
    if (category && category.trim() && category.trim().toLowerCase() !== 'all') {
      query.category = { $regex: `^${category.trim()}$`, $options: 'i' };
    }

    // Filter by Media Type (image vs video)
    if (type && type.trim() && type.trim().toLowerCase() !== 'all') {
      query.type = type.trim().toLowerCase();
    }

    // Search query
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const regex = { $regex: searchTerm, $options: 'i' };
      query.$or = [
        { title: regex },
        { description: regex },
        { location: regex },
        { tags: { $in: [new RegExp(searchTerm, 'i')] } }
      ];
    }

    const maxLimit = parseInt(limit, 10) || 100;

    const [mediaItems, totalCount, categories] = await Promise.all([
      collection
        .find(query)
        .sort({ type: 1, title: 1 })
        .limit(maxLimit)
        .toArray(),
      collection.countDocuments(query),
      collection.distinct('category')
    ]);

    return res.status(200).json({
      status: 'success',
      total: totalCount,
      count: mediaItems.length,
      filters: {
        category: category || null,
        type: type || null,
        search: search || null
      },
      available_categories: categories.sort(),
      data: mediaItems
    });
  } catch (error) {
    console.error('Error fetching media gallery:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve media gallery records.',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/media/:id
 * Retrieves a single media item by its slug ID.
 */
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection('media_gallery');
    const { id } = req.params;

    const item = await collection.findOne({
      $or: [
        { id: id.toLowerCase() },
        { id: id }
      ]
    });

    if (!item) {
      return res.status(404).json({
        status: 'error',
        message: `Media item with ID '${id}' not found.`
      });
    }

    return res.status(200).json({
      status: 'success',
      data: item
    });
  } catch (error) {
    console.error('Error fetching media item:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve media item.',
      error: error.message
    });
  }
});

module.exports = router;
