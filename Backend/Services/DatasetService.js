const datasetRepository = require('../Repositories/DatasetRepository');
const publicationRepository = require('../Repositories/PublicationRepository');
const projectRepository = require('../Repositories/ProjectRepository');
const { getDb } = require('../Configuration/database');

class DatasetService {
  formatDataset(d) {
    if (!d) return null;
    const doc = { ...d };
    if (doc._id) {
      if (!doc.id) doc.id = doc._id.toString();
      delete doc._id;
    }
    doc.title = doc.title || doc.name || doc.dataset_title || 'Untitled Dataset';
    doc.downloadUrl = doc.downloadUrl || doc.download_url || `/api/datasets/${doc.dataset_id || doc.id || 'dataset'}/download`;
    doc.isSingleFile = doc.isSingleFile !== undefined ? Boolean(doc.isSingleFile) : (doc.is_single_file !== undefined ? Boolean(doc.is_single_file) : true);
    doc.primaryFile = doc.primaryFile || doc.primary_file || doc.file_format || 'data.csv';
    return doc;
  }

  async getDatasets(query = {}) {
    const { search, category, discipline, station, region, limit = 50, page = 1 } = query;
    const filter = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { dataset_id: regex },
        { title: regex },
        { description: regex },
        { parameters: regex },
        { source: regex }
      ];
    }

    if (category && category !== 'all' && category.trim()) {
      const cat = category.trim();
      const catCond = [
        { category: { $regex: cat, $options: 'i' } },
        { discipline: { $regex: cat, $options: 'i' } }
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: catCond }];
        delete filter.$or;
      } else {
        filter.$or = catCond;
      }
    } else if (discipline && discipline.trim()) {
      filter.discipline = { $regex: discipline.trim(), $options: 'i' };
    }

    if (station && station.trim()) {
      filter.station_id = station.trim();
    }
    if (region && region.trim()) {
      filter.region = { $regex: region.trim(), $options: 'i' };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const parsedLimit = parseInt(limit, 10);

    const [datasets, total] = await Promise.all([
      datasetRepository.find(filter, { skip, limit: parsedLimit, sort: { created_at: -1, dataset_id: 1 } }),
      datasetRepository.count(filter)
    ]);

    const formattedDatasets = datasets.map(d => this.formatDataset(d));

    return { datasets: formattedDatasets, total, page: parseInt(page, 10), limit: parsedLimit };
  }

  async getDatasetById(id) {
    const dataset = await datasetRepository.findByDatasetId(id);
    if (!dataset) {
      throw { statusCode: 404, message: `Dataset not found for id: ${id}` };
    }

    // Dynamic record count from underlying collection if linked
    let liveRecordCount = null;
    if (dataset.related_collection) {
      try {
        const db = getDb();
        liveRecordCount = await db.collection(dataset.related_collection).countDocuments();
      } catch (e) {}
    }

    return this.formatDataset({
      ...dataset,
      live_records_count: liveRecordCount
    });
  }

  async getDatasetMetadata(id) {
    const dataset = await this.getDatasetById(id);
    return {
      dataset_id: dataset.dataset_id,
      title: dataset.title,
      description: dataset.description,
      source: dataset.source,
      creator: dataset.creator,
      station_id: dataset.station_id,
      region: dataset.region,
      discipline: dataset.discipline,
      parameters: dataset.parameters,
      temporal_coverage: dataset.temporal_coverage,
      spatial_coverage: dataset.spatial_coverage,
      file_format: dataset.file_format,
      size_mb: dataset.size_mb,
      access_level: dataset.access_level,
      license: dataset.license,
      citation_text: dataset.citation_text
    };
  }

  async getRelatedDatasets(id) {
    const dataset = await this.getDatasetById(id);
    return datasetRepository.find({
      dataset_id: { $ne: dataset.dataset_id },
      $or: [
        { discipline: dataset.discipline },
        { station_id: dataset.station_id },
        { region: dataset.region }
      ]
    }, { limit: 5 });
  }

  async searchDatasets(q) {
    return datasetRepository.search(q);
  }

  async submitDataset(data, userId) {
    if (!data.title || !data.discipline) {
      throw { statusCode: 400, message: 'Dataset title and scientific discipline are required.' };
    }
    const autoId = `DS-SUB-${Date.now().toString().slice(-6)}`;
    const newDoc = {
      dataset_id: data.dataset_id || autoId,
      title: data.title,
      description: data.description || '',
      source: data.source || 'Submitted by Researcher',
      creator: data.creator || 'Verified Contributor',
      station_id: data.station_id || 'unspecified',
      region: data.region || 'Polar',
      discipline: data.discipline,
      parameters: data.parameters || [],
      temporal_coverage: data.temporal_coverage || 'N/A',
      spatial_coverage: data.spatial_coverage || 'N/A',
      file_format: data.file_format || 'CSV',
      access_level: 'Under Review',
      license: data.license || 'CC BY 4.0',
      submitted_by: userId,
      submission_status: 'PendingReview'
    };

    return datasetRepository.insertOne(newDoc);
  }
}

module.exports = new DatasetService();
