const datasetSubmissionRepo = require('../Repositories/DatasetSubmissionRepository');
const datasetRepo = require('../Repositories/DatasetRepository');
const { getDb } = require('../Configuration/database');
const { success, error } = require('../Utilities/responseFormatter');

// Curated Hugging Face Datasets Map for instant fallback resolution
const HF_DATASET_MAP = {
  'sub-weather-aws': {
    title: 'Meteorological AWS Timeseries Data',
    category: '01_Weather',
    downloadUrl: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/01_Weather/csv_file/csv_file_bundle.zip'
  },
  'sub-sci-ocean': {
    title: 'Ocean Climatology & Hydrography',
    category: '02_scientific',
    downloadUrl: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/02_scientific/ocean/ocean_bundle.zip'
  },
  'sub-sci-cryo': {
    title: 'Cryosphere & Glaciology Records',
    category: '02_scientific',
    downloadUrl: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/02_scientific/cryosphere/cryosphere_bundle.zip'
  },
  'sub-sci-atmosphere': {
    title: 'Atmosphere & Aerosols Telemetry',
    category: '02_scientific',
    downloadUrl: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/02_scientific/atmosphere/black_carbon_maitri.csv'
  },
  'sub-res-papers': {
    title: 'Scientific Research Papers & Project Summaries',
    category: '03_Research',
    downloadUrl: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/03_Research/csv_file/csv_file_bundle.zip'
  },
  'sub-exp-reports': {
    title: 'Expedition Annual Technical Reports',
    category: '04_expeditions',
    downloadUrl: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/04_expeditions/expedition_reports/expedition_reports_bundle.zip'
  },
  'sub-exp-pubs': {
    title: 'Expedition Publications & Monograms',
    category: '04_expeditions',
    downloadUrl: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/04_expeditions/publications/publications_bundle.zip'
  },
  'sub-exp-scientific-reports': {
    title: 'Expedition Scientific Findings Reports',
    category: '04_expeditions',
    downloadUrl: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/04_expeditions/scientific_reports/scientific_reports_bundle.zip'
  },
  'sub-outreach-photos': {
    title: 'High-Resolution Polar Photography',
    category: '05_Outreach',
    downloadUrl: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/05_Outreach/Photos/Photos_bundle.zip'
  },
  'sub-outreach-videos': {
    title: 'Field Station Documentary Videos & Media',
    category: '05_Outreach',
    downloadUrl: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/05_Outreach/videos/videos_bundle.zip'
  },
  'sub-geo-layers': {
    title: 'Geographical Boundary Layers (GeoJSON / SHP)',
    category: '06_Satellite Geospatial',
    downloadUrl: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/06_Satellite%20Geospatial/Geographical_Layers/Geographical_Layers_bundle.zip'
  },
  'sub-geo-imagery': {
    title: 'Satellite Imagery Mosaic & Shaded Relief',
    category: '06_Satellite Geospatial',
    downloadUrl: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/06_Satellite%20Geospatial/Satellite_Imagery/Satellite_Imagery_bundle.zip'
  },
  'sub-geo-rasters': {
    title: 'Sea Ice GeoTIFF Rasters & Concentration Grids',
    category: '06_Satellite Geospatial',
    downloadUrl: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/06_Satellite%20Geospatial/Sea_Ice_Data/Sea_Ice_Data_bundle.zip'
  },
  'sub-geo-docs': {
    title: 'Sea Ice Remote Sensing Documentation',
    category: '06_Satellite Geospatial',
    downloadUrl: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/06_Satellite%20Geospatial/Documents/Documents_bundle.zip'
  }
};

class DatasetGovernanceController {
  /**
   * Protected Download Route: GET /api/datasets/download/:id
   * Validates user session, logs download telemetry, and redirects or returns resolved URL.
   */
  async downloadDataset(req, res, next) {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!id) {
        return error(res, 'Dataset ID is required for download.', 400);
      }

      // 1. Resolve dataset and download URL
      let resolvedUrl = null;
      let datasetTitle = 'Polar Dataset';
      let category = 'scientific';

      // Check curated Hugging Face map
      if (HF_DATASET_MAP[id]) {
        resolvedUrl = HF_DATASET_MAP[id].downloadUrl;
        datasetTitle = HF_DATASET_MAP[id].title;
        category = HF_DATASET_MAP[id].category;
      } else {
        // Look up in primary MongoDB datasets collection
        const dbDataset = await datasetRepo.findByDatasetId(id);
        if (dbDataset) {
          resolvedUrl = dbDataset.downloadUrl || dbDataset.download_url || dbDataset.file_url;
          datasetTitle = dbDataset.title || dbDataset.name || datasetTitle;
          category = dbDataset.category || dbDataset.discipline || category;
        }
      }

      // Check query parameter fallback if provided
      if (!resolvedUrl && req.query.url) {
        resolvedUrl = req.query.url;
      }

      // Default fallback if no specific URL found
      if (!resolvedUrl) {
        resolvedUrl = `https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/tree/main`;
      }

      // 2. Log download telemetry
      try {
        const db = getDb();
        await db.collection('download_telemetry').insertOne({
          dataset_id: id,
          dataset_title: datasetTitle,
          category,
          download_url: resolvedUrl,
          user_id: user.userId || user.id,
          user_name: user.name || 'Polar Researcher',
          user_email: user.email,
          user_role: user.role,
          ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          user_agent: req.headers['user-agent'] || 'unknown',
          timestamp: new Date().toISOString(),
          downloaded_at: new Date().toISOString()
        });
      } catch (telemetryErr) {
        console.warn('⚠️ Telemetry log warning:', telemetryErr.message);
      }

      // 3. Response: Support JSON payload for API/tests or 302 redirect for browser navigations
      const redirectQuery = req.query.redirect;
      const isHtmlOrNavigate = req.headers['accept'] && req.headers['accept'].includes('text/html');
      const isBrowserQueryToken = Boolean(req.query && req.query.token);

      if (redirectQuery === 'true' || (redirectQuery !== 'false' && (isHtmlOrNavigate || isBrowserQueryToken))) {
        return res.redirect(302, resolvedUrl);
      }

      return success(res, {
        dataset_id: id,
        title: datasetTitle,
        download_url: resolvedUrl,
        authorized_for: {
          user_id: user.userId || user.id,
          name: user.name,
          role: user.role
        },
        telemetry_logged: true
      }, 'Download authorization granted');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Researcher & Admin Upload: POST /api/submissions/upload
   * Takes dataset metadata and saves with status: 'pending'.
   */
  async uploadSubmission(req, res, next) {
    try {
      const user = req.user;
      const {
        title,
        category,
        discipline,
        description,
        abstract,
        file_url,
        fileUrl,
        file_format,
        fileFormat,
        parameters,
        temporal_coverage,
        spatial_coverage,
        institution
      } = req.body;

      if (!title || !title.trim()) {
        return error(res, 'Dataset title is required.', 400);
      }

      const assignedCategory = category || discipline || '02_scientific';
      const resolvedFileUrl = file_url || fileUrl || '';
      const resolvedFormat = file_format || fileFormat || 'CSV';
      const resolvedDesc = description || abstract || '';
      const userInstitution = institution || user.institution || '';

      const submissionDoc = {
        submission_id: `SUB-${Date.now().toString().slice(-6)}`,
        title: title.trim(),
        category: assignedCategory,
        discipline: discipline || assignedCategory,
        description: resolvedDesc.trim(),
        file_url: resolvedFileUrl.trim(),
        download_url: resolvedFileUrl.trim(),
        file_format: resolvedFormat,
        parameters: Array.isArray(parameters) ? parameters : (parameters ? [parameters] : []),
        temporal_coverage: temporal_coverage || 'N/A',
        spatial_coverage: spatial_coverage || 'Polar Region',
        researcher_id: user.userId || user.id,
        researcher_name: user.name || 'Verified Researcher',
        researcher_email: user.email,
        institution: userInstitution,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const newSubmission = await datasetSubmissionRepo.insertOne(submissionDoc);

      return success(
        res,
        newSubmission,
        'Dataset submitted successfully. It is now pending Administrator verification.',
        201
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: GET /api/admin/submissions
   * Fetches submissions (?status=pending by default).
   */
  async getAdminSubmissions(req, res, next) {
    try {
      const statusFilter = req.query.status || 'pending';
      let submissions;
      if (statusFilter === 'all') {
        submissions = await datasetSubmissionRepo.findByStatus('all');
      } else {
        submissions = await datasetSubmissionRepo.findByStatus(statusFilter);
      }

      return success(res, {
        submissions,
        total: submissions.length,
        filter: statusFilter
      }, 'Admin submissions retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Admin: POST /api/admin/submissions/:id/decision
   * Body: { decision: "approve" | "reject", remarks: "..." }
   */
  async makeDecision(req, res, next) {
    try {
      const { id } = req.params;
      const { decision, remarks } = req.body;
      const adminUser = req.user;

      if (!decision || !['approve', 'reject'].includes(decision.toLowerCase())) {
        return error(res, "Decision must be either 'approve' or 'reject'.", 400);
      }

      const submission = await datasetSubmissionRepo.findSubmissionById(id);
      if (!submission) {
        return error(res, `Dataset submission not found for id: ${id}`, 404);
      }

      const normalizedDecision = decision.toLowerCase();
      const now = new Date().toISOString();

      if (normalizedDecision === 'approve') {
        // 1. Update submission status to 'approved'
        await datasetSubmissionRepo.updateOne(
          { _id: datasetSubmissionRepo.toObjectId(submission.id || submission._id) },
          {
            status: 'approved',
            reviewed_by: adminUser.userId || adminUser.id,
            reviewer_name: adminUser.name,
            reviewed_at: now,
            admin_remarks: remarks || 'Approved for NCPOR National Scientific Catalog.'
          }
        );

        // 2. Automatically insert into live 'datasets' collection
        const newDatasetId = `ds-gov-${Date.now().toString().slice(-8)}`;
        const liveDatasetDoc = {
          id: newDatasetId,
          dataset_id: newDatasetId,
          title: submission.title,
          category: submission.category,
          discipline: submission.discipline || submission.category,
          description: submission.description,
          file_format: submission.file_format || 'CSV',
          downloadUrl: submission.file_url || `https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/tree/main`,
          download_url: submission.file_url || `https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/tree/main`,
          primaryFile: submission.file_url || 'dataset_bundle.zip',
          isSingleFile: submission.file_format !== 'ZIP',
          creator: submission.researcher_name,
          source: `${submission.researcher_name}${submission.institution ? ' (' + submission.institution + ')' : ''}`,
          institution: submission.institution || '',
          contributor_email: submission.researcher_email,
          parameters: submission.parameters || [],
          temporal_coverage: submission.temporal_coverage || 'Current',
          spatial_coverage: submission.spatial_coverage || 'Polar',
          access_level: 'Public Verified',
          license: 'CC BY 4.0 NCPOR',
          submission_id: submission.submission_id || id,
          status: 'published',
          created_at: now,
          updated_at: now
        };

        const insertedDataset = await datasetRepo.insertOne(liveDatasetDoc);

        return success(res, {
          submission_id: submission.submission_id || id,
          decision: 'approved',
          dataset: insertedDataset,
          message: 'Dataset approved and automatically published to live datasets collection.'
        }, 'Submission approved and dataset published to live catalog.');
      } else {
        // Rejection branch
        await datasetSubmissionRepo.updateOne(
          { _id: datasetSubmissionRepo.toObjectId(submission.id || submission._id) },
          {
            status: 'rejected',
            reviewed_by: adminUser.userId || adminUser.id,
            reviewer_name: adminUser.name,
            reviewed_at: now,
            admin_remarks: remarks || 'Submission does not meet polar dataset quality standards.'
          }
        );

        return success(res, {
          submission_id: submission.submission_id || id,
          decision: 'rejected',
          remarks: remarks || '',
          reviewed_at: now
        }, 'Submission rejected successfully.');
      }
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DatasetGovernanceController();
