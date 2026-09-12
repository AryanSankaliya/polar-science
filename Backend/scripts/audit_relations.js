const { connectToDatabase, closeDatabase } = require('../Configuration/database');

async function auditRelations() {
  const db = await connectToDatabase();
  
  const stations = await db.collection('stations').find({}).toArray();
  const stationIds = new Set(stations.map(s => s.station_id).concat(stations.map(s => s.name)));
  
  const researchers = await db.collection('researchers').find({}).toArray();
  const researcherIds = new Set(researchers.map(r => r.researcher_id).concat(researchers.map(r => r.id)));
  
  const publications = await db.collection('publications').find({}).toArray();
  const pubIds = new Set(publications.map(p => p.publication_id).concat(publications.map(p => p.id)));
  
  const datasets = await db.collection('datasets').find({}).toArray();
  const datasetIds = new Set(datasets.map(d => d.dataset_id).concat(datasets.map(d => d.id)));
  
  const projects = await db.collection('projects').find({}).toArray();
  const projectCodes = new Set(projects.map(p => p.project_code));

  const expeditions = await db.collection('expeditions').find({}).toArray();
  const expeditionIds = new Set(expeditions.map(e => e.document_id).concat(expeditions.map(e => e.expedition_number)));

  console.log('=== DANGLING / BROKEN RELATIONAL POINTERS ===');

  // Check projects
  projects.forEach(p => {
    (p.publication_ids || []).forEach(pubId => {
      if (!pubIds.has(pubId)) {
        console.log(`[DANGLING LINK] Project ${p.project_code} references missing publication: "${pubId}"`);
      }
    });
    (p.dataset_ids || []).forEach(dsId => {
      if (!datasetIds.has(dsId)) {
        console.log(`[DANGLING LINK] Project ${p.project_code} references missing dataset: "${dsId}"`);
      }
    });
    (p.station_ids || []).forEach(stnId => {
      if (!stationIds.has(stnId)) {
        console.log(`[DANGLING LINK] Project ${p.project_code} references missing station: "${stnId}"`);
      }
    });
    (p.expedition_ids || []).forEach(expId => {
      if (!expeditionIds.has(expId)) {
        console.log(`[DANGLING LINK] Project ${p.project_code} references missing expedition: "${expId}"`);
      }
    });
  });

  // Check researchers
  researchers.forEach(r => {
    (r.stations || []).forEach(stnId => {
      if (!stationIds.has(stnId)) {
        console.log(`[DANGLING LINK] Researcher ${r.name} references missing station: "${stnId}"`);
      }
    });
    (r.expeditions || []).forEach(expId => {
      if (!expeditionIds.has(expId)) {
        console.log(`[DANGLING LINK] Researcher ${r.name} references missing expedition: "${expId}"`);
      }
    });
  });

  // Check publications
  publications.forEach(pub => {
    (pub.project_ids || []).forEach(prId => {
      if (!projectCodes.has(prId)) {
        console.log(`[DANGLING LINK] Publication ${pub.publication_id} references missing project: "${prId}"`);
      }
    });
    (pub.dataset_ids || []).forEach(dsId => {
      if (!datasetIds.has(dsId)) {
        console.log(`[DANGLING LINK] Publication ${pub.publication_id} references missing dataset: "${dsId}"`);
      }
    });
    (pub.expedition_ids || []).forEach(expId => {
      if (!expeditionIds.has(expId)) {
        console.log(`[DANGLING LINK] Publication ${pub.publication_id} references missing expedition: "${expId}"`);
      }
    });
  });

  // Check datasets
  datasets.forEach(d => {
    if (d.station_id && !stationIds.has(d.station_id)) {
      console.log(`[DANGLING LINK] Dataset ${d.dataset_id} references missing station: "${d.station_id}"`);
    }
  });

  await closeDatabase();
}

auditRelations();
