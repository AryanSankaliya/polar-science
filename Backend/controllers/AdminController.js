const { getDb } = require('../Configuration/database');
const { success } = require('../Utilities/responseFormatter');

class AdminController {
  async getMetrics(req, res, next) {
    try {
      const db = getDb();

      const [
        usersCount,
        stationsCount,
        expeditionsCount,
        researchersCount,
        projectsCount,
        publicationsCount,
        datasetsCount,
        mediaCount,
        oceanCount,
        iceCount,
        reviewsCount
      ] = await Promise.all([
        db.collection('users').countDocuments(),
        db.collection('stations').countDocuments(),
        db.collection('expeditions').countDocuments(),
        db.collection('researchers').countDocuments(),
        db.collection('projects').countDocuments(),
        db.collection('publications').countDocuments(),
        db.collection('datasets').countDocuments(),
        db.collection('media_gallery').countDocuments(),
        db.collection('scientific_oceans').countDocuments(),
        db.collection('scientific_ice_cores').countDocuments(),
        db.collection('reviews').countDocuments()
      ]);

      return success(res, {
        system_status: 'HEALTHY',
        database: 'polar_hub (MongoDB Connected)',
        timestamp: new Date().toISOString(),
        metrics: {
          total_users: usersCount,
          total_stations: stationsCount,
          total_expeditions: expeditionsCount,
          total_researchers: researchersCount,
          total_projects: projectsCount,
          total_publications: publicationsCount,
          total_datasets_in_catalogue: datasetsCount,
          total_media_assets: mediaCount,
          ocean_data_points: oceanCount,
          ice_core_records: iceCount,
          review_submissions: reviewsCount
        }
      }, 'System operational metrics retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getAuditLogs(req, res, next) {
    try {
      const db = getDb();
      const reviewsWithAudit = await db.collection('reviews')
        .find({ 'audit_history.0': { $exists: true } })
        .project({ review_id: 1, title: 1, audit_history: 1 })
        .toArray();

      const allLogs = [];
      for (const r of reviewsWithAudit) {
        if (Array.isArray(r.audit_history)) {
          for (const entry of r.audit_history) {
            allLogs.push({
              review_id: r.review_id,
              review_title: r.title,
              ...entry
            });
          }
        }
      }

      allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return success(res, allLogs, 'Audit history logs retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
