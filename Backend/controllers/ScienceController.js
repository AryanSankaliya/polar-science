const scienceService = require('../Services/ScienceService');
const { success } = require('../Utilities/responseFormatter');

class ScienceController {
  async getDisciplines(req, res, next) {
    try {
      const disciplines = await scienceService.getDisciplines();
      return success(res, disciplines, 'Science disciplines retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getDisciplineById(req, res, next) {
    try {
      const discipline = await scienceService.getDisciplineById(req.params.id);
      return success(res, discipline, 'Science discipline details and linked resources retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getProjectsByDiscipline(req, res, next) {
    try {
      const projects = await scienceService.getProjectsByDiscipline(req.params.id);
      return success(res, projects, 'Projects in discipline retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getDatasetsByDiscipline(req, res, next) {
    try {
      const datasets = await scienceService.getDatasetsByDiscipline(req.params.id);
      return success(res, datasets, 'Datasets in discipline retrieved');
    } catch (err) {
      next(err);
    }
  }

  async getVisualizerDatasets(req, res, next) {
    try {
      const { getDb } = require('../Configuration/database');
      const db = getDb();
      const docs = await db.collection('visualizer_datasets').find({}).toArray();
      const sanitized = docs.map(d => {
        const item = { ...d };
        if (item._id) {
          if (!item.id) item.id = item._id.toString();
          delete item._id;
        }
        return item;
      });
      return res.status(200).json({
        success: true,
        count: sanitized.length,
        data: sanitized
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  async getVisualizerDatasetById(req, res, next) {
    try {
      const { getDb } = require('../Configuration/database');
      const { ObjectId } = require('mongodb');
      const db = getDb();
      const id = req.params.id;

      const query = {
        $or: [
          { id: id },
          { dataset_id: id }
        ]
      };
      if (typeof id === 'string' && ObjectId.isValid(id) && id.length === 24) {
        query.$or.push({ _id: new ObjectId(id) });
      }

      const doc = await db.collection('visualizer_datasets').findOne(query);
      if (!doc) {
        return res.status(404).json({
          success: false,
          error: `Visualizer dataset not found for id: ${id}`
        });
      }
      const item = { ...doc };
      if (item._id) {
        if (!item.id) item.id = item._id.toString();
        delete item._id;
      }
      return res.status(200).json({
        success: true,
        data: item
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
}

module.exports = new ScienceController();

