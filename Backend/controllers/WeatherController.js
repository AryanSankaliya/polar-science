const { getDb } = require('../Configuration/database');

class WeatherController {
  formatRecord(doc) {
    if (!doc) return null;
    const formatted = { ...doc };
    if (formatted._id) {
      if (!formatted.id) formatted.id = formatted._id.toString();
      delete formatted._id;
    }
    // Ensure numeric float fields
    if (formatted.air_temperature_celsius !== undefined) {
      formatted.air_temperature_celsius = parseFloat(formatted.air_temperature_celsius);
    }
    if (formatted.wind_direction_deg !== undefined) {
      formatted.wind_direction_deg = parseFloat(formatted.wind_direction_deg);
    }
    if (formatted.wind_speed_m_s !== undefined) {
      formatted.wind_speed_m_s = parseFloat(formatted.wind_speed_m_s);
    }
    if (formatted.relative_humidity_percent !== undefined) {
      formatted.relative_humidity_percent = parseFloat(formatted.relative_humidity_percent);
    }
    if (formatted.atmospheric_pressure_hpa !== undefined) {
      formatted.atmospheric_pressure_hpa = parseFloat(formatted.atmospheric_pressure_hpa);
    }
    return formatted;
  }

  async getWeatherTelemetry(req, res, next) {
    try {
      const db = getDb();
      const collection = db.collection('weather_telemetry');

      const { station, range, limit } = req.query;
      const query = {};

      if (station && station.trim() && station.trim().toLowerCase() !== 'all') {
        query.station = { $regex: new RegExp(station.trim(), 'i') };
      }

      let maxLimit = parseInt(limit, 10);
      if (isNaN(maxLimit) || maxLimit <= 0) {
        if (range === '24h') maxLimit = 24;
        else if (range === '7d') maxLimit = 24 * 7;
        else if (range === '30d') maxLimit = 24 * 30;
        else maxLimit = 24; // Default to 24 hourly readings
      }

      // Fetch most recent records descending by timestamp
      const rawRecords = await collection
        .find(query)
        .sort({ timestamp: -1 })
        .limit(maxLimit)
        .toArray();

      // Format records and put back in chronological order (ascending) for Chart.js / Recharts
      const formattedRecords = rawRecords.map(r => this.formatRecord(r)).reverse();

      if (req.query.format === 'wrapped') {
        return res.status(200).json({
          success: true,
          count: formattedRecords.length,
          station: station || 'All',
          range: range || 'all',
          data: formattedRecords
        });
      }

      return res.status(200).json(formattedRecords);
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  async getLatestStationReadings(req, res, next) {
    try {
      const db = getDb();
      const collection = db.collection('weather_telemetry');
      const targetStations = ['Maitri', 'Bharati', 'Himadri'];
      const latest = {};

      await Promise.all(targetStations.map(async (stn) => {
        const doc = await collection.findOne(
          { station: { $regex: new RegExp(`^${stn}$`, 'i') } },
          { sort: { timestamp: -1 } }
        );
        if (doc) {
          latest[stn] = this.formatRecord(doc);
        }
      }));

      return res.status(200).json({
        success: true,
        stations: latest,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
}

module.exports = new WeatherController();

