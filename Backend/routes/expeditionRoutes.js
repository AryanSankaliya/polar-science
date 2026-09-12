const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { getDb } = require('../db');

function escapeRegex(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Helper to parse a primary numeric year from operational_year string (e.g., "2021-2022" -> 2021)
 */
function parseYear(yearStr) {
  if (!yearStr) return 0;
  const match = String(yearStr).match(/(\d{4})/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Helper to parse numeric expedition number (e.g. "41st ISEA" -> 41)
 */
function parseExpeditionNum(numStr) {
  if (!numStr) return 0;
  const match = String(numStr).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * GET /api/v1/expeditions
 * Optional query params:
 *   ?vessel=...
 *   ?year=...
 *   ?search=...
 *   ?station=...
 */
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const expCol = db.collection('expeditions');

    const { vessel, year, search, station } = req.query;
    const filter = {};
    const andConditions = [];

    // Filter by vessel (case-insensitive array/string match)
    if (vessel && typeof vessel === 'string' && vessel.trim()) {
      const safeVessel = escapeRegex(vessel.trim());
      andConditions.push({
        vessel: { $regex: safeVessel, $options: 'i' }
      });
    }

    // Filter by operational year or season
    if (year && typeof year === 'string' && year.trim()) {
      const safeYear = escapeRegex(year.trim());
      andConditions.push({
        $or: [
          { operational_year: { $regex: safeYear, $options: 'i' } },
          { season: { $regex: safeYear, $options: 'i' } }
        ]
      });
    }

    // Filter by station/port
    if (station && typeof station === 'string' && station.trim()) {
      const safeStation = escapeRegex(station.trim());
      andConditions.push({
        ports: { $regex: safeStation, $options: 'i' }
      });
    }

    // Full metadata search across relevant fields
    if (search && typeof search === 'string' && search.trim()) {
      const safeSearch = escapeRegex(search.trim());
      const searchRegex = { $regex: safeSearch, $options: 'i' };
      andConditions.push({
        $or: [
          { expedition_number: searchRegex },
          { expedition_title: searchRegex },
          { vessel: searchRegex },
          { operational_year: searchRegex },
          { route: searchRegex },
          { ports: searchRegex },
          { operational_highlights: searchRegex },
          { environmental_summary: searchRegex },
          { source_document: searchRegex }
        ]
      });
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    const rawRecords = await expCol.find(filter).toArray();

    // Chronological & Expedition Number Sorting (Descending: most recent first)
    rawRecords.sort((a, b) => {
      const yearA = parseYear(a.operational_year);
      const yearB = parseYear(b.operational_year);
      if (yearB !== yearA) {
        return yearB - yearA;
      }
      const numA = parseExpeditionNum(a.expedition_number);
      const numB = parseExpeditionNum(b.expedition_number);
      if (numB !== numA) {
        return numB - numA;
      }
      return (a.document_id || '').localeCompare(b.document_id || '');
    });

    // Dynamic stats derived directly from the filtered dataset
    const vesselsSet = new Set();
    const stationsSet = new Set();
    const knownStations = ['Maitri', 'Bharati', 'Dakshin Gangotri', 'Himadri', 'Ny-Ålesund', 'Schirmacher Oasis', 'Larsemann Hills'];

    for (const rec of rawRecords) {
      if (Array.isArray(rec.vessel)) {
        rec.vessel.forEach(v => {
          if (v && v.trim()) vesselsSet.add(v.trim());
        });
      }
      if (Array.isArray(rec.ports)) {
        rec.ports.forEach(p => {
          if (p && p.trim()) {
            const trimmed = p.trim();
            if (knownStations.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
              stationsSet.add(trimmed);
            }
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      count: rawRecords.length,
      stats: {
        total_expeditions_tracked: rawRecords.length,
        unique_vessels_used: vesselsSet.size,
        stations_covered: stationsSet.size
      },
      data: rawRecords
    });
  } catch (error) {
    console.error('Error in GET /api/v1/expeditions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve expedition records',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/expeditions/:id
 * Supports document_id (e.g. 'exp_001') or MongoDB _id
 * Returns expedition metadata with matching grounded chunks
 */
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const expCol = db.collection('expeditions');
    const chunkCol = db.collection('expedition_chunks');

    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Valid expedition identifier is required'
      });
    }

    let query = { document_id: id };
    if (ObjectId.isValid(id) && id.length === 24) {
      query = {
        $or: [
          { document_id: id },
          { _id: new ObjectId(id) }
        ]
      };
    }

    const expedition = await expCol.findOne(query);
    if (!expedition) {
      return res.status(404).json({
        success: false,
        message: `Expedition record not found for id: ${id}`
      });
    }

    // Retrieve associated chunks for grounded evidence
    const chunks = await chunkCol.find({
      $or: [
        { document_id: expedition.document_id },
        { source_document: expedition.source_document }
      ]
    })
    .project({
      _id: 0,
      chunk_id: 1,
      document_id: 1,
      source_document: 1,
      page: 1,
      page_number: 1,
      chunk_text: 1
    })
    .sort({ page: 1, chunk_id: 1 })
    .limit(100)
    .toArray();

    return res.status(200).json({
      success: true,
      data: {
        ...expedition,
        chunks
      }
    });
  } catch (error) {
    console.error(`Error in GET /api/v1/expeditions/${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve expedition details',
      error: error.message
    });
  }
});

module.exports = router;
