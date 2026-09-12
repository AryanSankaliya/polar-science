const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

/**
 * Calculates linear regression trend metrics for sea ice extent over time.
 * @param {Array} records - Array of sea ice observation objects.
 * @returns {Object} Decadal change rate metrics.
 */
function computeDecadalChangeRate(records) {
  if (!records || records.length < 2) {
    return {
      change_million_sq_km_per_decade: 0,
      percent_change_per_decade: 0,
      confidence: 'insufficient_data',
      assessment: 'Insufficient observations for decadal projection'
    };
  }

  const startDate = new Date(records[0].date).getTime();
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  const n = records.length;

  for (let i = 0; i < n; i++) {
    const tDays = (new Date(records[i].date).getTime() - startDate) / (1000 * 60 * 60 * 24);
    const y = records[i].sea_ice_extent_million_sq_km;
    sumX += tDays;
    sumY += y;
    sumXY += tDays * y;
    sumXX += tDays * tDays;
  }

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) {
    return {
      change_million_sq_km_per_decade: 0,
      percent_change_per_decade: 0,
      assessment: 'Zero temporal variance'
    };
  }

  const slopePerDay = (n * sumXY - sumX * sumY) / denominator;
  const meanExtent = sumY / n;
  // 1 decade = 365.25 * 10 = 3652.5 days
  const changePerDecade = slopePerDay * 3652.5;
  const percentChangePerDecade = meanExtent > 0 ? (changePerDecade / meanExtent) * 100 : 0;

  let assessment = 'Stable';
  if (percentChangePerDecade <= -5.0) {
    assessment = 'Accelerated Antarctic Sea Ice Decline';
  } else if (percentChangePerDecade < 0) {
    assessment = 'Moderate Sea Ice Contraction';
  } else if (percentChangePerDecade > 5.0) {
    assessment = 'Significant Sea Ice Expansion';
  } else if (percentChangePerDecade > 0) {
    assessment = 'Slight Expansion / Positive Anomaly';
  }

  return {
    change_million_sq_km_per_decade: parseFloat(changePerDecade.toFixed(3)),
    percent_change_per_decade: parseFloat(percentChangePerDecade.toFixed(2)),
    daily_slope_sq_km: parseFloat((slopePerDay * 1_000_000).toFixed(1)),
    mean_extent_million_sq_km: parseFloat(meanExtent.toFixed(3)),
    assessment
  };
}

/**
 * GET /api/v1/satellite/sea-ice
 * Retrieves daily satellite sea ice extent time-series with comprehensive summary stats.
 * Query Parameters:
 *  - start_year: Filter observations starting from year (e.g. 2015)
 *  - end_year: Filter observations up to year (e.g. 2024)
 *  - month: Filter specific calendar month (1 to 12)
 *  - limit: Maximum data points to return (default: 2500)
 */
router.get('/sea-ice', async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection('satellite_sea_ice');

    const { start_year, end_year, month, limit } = req.query;
    const query = {};

    if (start_year || end_year) {
      query.year = {};
      if (start_year) query.year.$gte = parseInt(start_year, 10);
      if (end_year) query.year.$lte = parseInt(end_year, 10);
    }

    if (month) {
      query.month = parseInt(month, 10);
    }

    const maxLimit = parseInt(limit, 10) || 2500;

    const data = await collection
      .find(query)
      .sort({ date: 1 })
      .limit(maxLimit)
      .toArray();

    if (data.length === 0) {
      return res.status(200).json({
        status: 'success',
        stats: null,
        count: 0,
        data: []
      });
    }

    // Compute all-time minimum and maximum extent
    let minRecord = data[0];
    let maxRecord = data[0];
    let totalExtentSum = 0;

    for (let i = 0; i < data.length; i++) {
      const ext = data[i].sea_ice_extent_million_sq_km;
      totalExtentSum += ext;
      if (ext < minRecord.sea_ice_extent_million_sq_km) {
        minRecord = data[i];
      }
      if (ext > maxRecord.sea_ice_extent_million_sq_km) {
        maxRecord = data[i];
      }
    }

    const avgExtent = parseFloat((totalExtentSum / data.length).toFixed(3));
    const decadalTrend = computeDecadalChangeRate(data);

    const stats = {
      all_time_min_extent: {
        date: minRecord.date,
        sea_ice_extent_million_sq_km: minRecord.sea_ice_extent_million_sq_km,
        sea_ice_extent_sq_km: minRecord.sea_ice_extent_sq_km,
        source_sensor: minRecord.source_sensor
      },
      all_time_max_extent: {
        date: maxRecord.date,
        sea_ice_extent_million_sq_km: maxRecord.sea_ice_extent_million_sq_km,
        sea_ice_extent_sq_km: maxRecord.sea_ice_extent_sq_km,
        source_sensor: maxRecord.source_sensor
      },
      average_extent_million_sq_km: avgExtent,
      decadal_change_rate: decadalTrend,
      date_range: {
        start: data[0].date,
        end: data[data.length - 1].date
      },
      total_observations: data.length
    };

    return res.status(200).json({
      status: 'success',
      stats,
      count: data.length,
      data
    });
  } catch (error) {
    console.error('Error fetching satellite sea ice data:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve satellite sea ice observations.',
      error: error.message
    });
  }
});

module.exports = router;
