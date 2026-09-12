const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

/**
 * GET /api/v1/stations/indian
 * Returns India's premier Antarctic scientific stations & bases (Maitri, Bharati, Dakshin Gangotri, India Bay Camp).
 * NOTE: Must be defined before '/:station_id' or general parameter matches.
 */
router.get('/indian', async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection('stations');

    const indianStations = await collection
      .find({ is_indian_station: true })
      .sort({ established_year: 1 })
      .toArray();

    return res.status(200).json({
      status: 'success',
      count: indianStations.length,
      data: indianStations
    });
  } catch (error) {
    console.error('Error fetching Indian polar stations:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve Indian polar stations.',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/stations
 * Returns Antarctic research stations with optional country, status, and text search filters.
 * Query Parameters:
 *  - country: Filter by country (e.g. 'India', 'United States', 'United Kingdom')
 *  - status: Filter by operational status (e.g. 'Active - Year Round', 'Summer Only', 'Historical')
 *  - search: Full search across station name, operator, or location
 *  - limit: Max records to return (default: 100)
 */
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection('stations');

    const { country, status, search, limit } = req.query;
    const query = {};

    // Filter by Country (Case-insensitive)
    if (country && country.trim() && country.trim().toLowerCase() !== 'all') {
      query.country = { $regex: `^${country.trim()}$`, $options: 'i' };
    }

    // Filter by Status (Case-insensitive)
    if (status && status.trim() && status.trim().toLowerCase() !== 'all') {
      query.status = { $regex: `^${status.trim()}$`, $options: 'i' };
    }

    // Search by Name, Location, or Operator
    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { name: regex },
        { location: regex },
        { operator: regex },
        { country: regex }
      ];
    }

    const maxLimit = parseInt(limit, 10) || 100;

    const [stations, totalCount, countries, statuses] = await Promise.all([
      collection
        .find(query)
        .sort({ is_indian_station: -1, name: 1 })
        .limit(maxLimit)
        .toArray(),
      collection.countDocuments(query),
      collection.distinct('country'),
      collection.distinct('status')
    ]);

    return res.status(200).json({
      status: 'success',
      total: totalCount,
      count: stations.length,
      filters: {
        country: country || null,
        status: status || null,
        search: search || null
      },
      available_countries: countries.sort(),
      available_statuses: statuses.sort(),
      data: stations
    });
  } catch (error) {
    console.error('Error fetching stations:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve polar research stations.',
      error: error.message
    });
  }
});

/**
 * GET /api/v1/stations/:station_id
 * Returns a specific station by its unique slug ID.
 */
router.get('/:station_id', async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection('stations');
    const { station_id } = req.params;

    const station = await collection.findOne({
      $or: [
        { station_id: station_id.toLowerCase() },
        { station_id: station_id }
      ]
    });

    if (!station) {
      return res.status(404).json({
        status: 'error',
        message: `Station with ID '${station_id}' not found.`
      });
    }

    return res.status(200).json({
      status: 'success',
      data: station
    });
  } catch (error) {
    console.error('Error fetching station details:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve station details.',
      error: error.message
    });
  }
});

module.exports = router;
