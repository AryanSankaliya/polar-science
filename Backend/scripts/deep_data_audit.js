const { connectToDatabase, closeDatabase } = require('../Configuration/database');
const fs = require('fs');
const path = require('path');

async function auditData() {
  const db = await connectToDatabase();
  console.log('Connected to DB for deep data audit.\n');

  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  console.log('=== ALL COLLECTIONS IN polar_hub ===');
  console.log(collectionNames.join(', '));
  console.log('Total collections:', collectionNames.length, '\n');

  const findings = [];

  // 1. Audit Counts and schemas
  const collectionStats = {};
  for (const name of collectionNames) {
    const count = await db.collection(name).countDocuments();
    const sample = await db.collection(name).find({}).limit(5).toArray();
    collectionStats[name] = { count, sample };
    console.log(`Collection [${name}]: ${count} documents`);
  }
  console.log('\n');

  // 2. Deep audit STATIONS
  const stations = await db.collection('stations').find({}).toArray();
  const stationIssues = [];
  stations.forEach(s => {
    if (s.region === undefined || s.region === null) {
      stationIssues.push(`Station "${s.name}" (id: ${s.station_id}) has missing/undefined "region" field`);
    }
    if (s.latitude === undefined || s.longitude === undefined) {
      stationIssues.push(`Station "${s.name}" has missing coordinates`);
    }
    if (!s.research_areas || s.research_areas.length === 0) {
      stationIssues.push(`Station "${s.name}" has empty research_areas array`);
    }
    if (!s.operator) {
      stationIssues.push(`Station "${s.name}" has missing operator`);
    }
  });

  // Check Indian stations specifically (Himadri?)
  const indianStations = stations.filter(s => s.is_indian_station);
  const indianStationNames = indianStations.map(s => s.name);
  console.log('Indian Stations present:', indianStationNames);
  if (!indianStationNames.some(n => /himadri/i.test(n))) {
    findings.push({
      category: 'Stations Missing Key National Infrastructure',
      severity: 'HIGH',
      description: 'Himadri (India designated Arctic research base in Ny-Ålesund, Svalbard established in 2008) is completely missing from the stations collection! Only Bharati, Maitri, Dakshin Gangotri, and India Bay Camp exist.'
    });
  }

  // 3. Deep audit EXPEDITIONS
  const expeditions = await db.collection('expeditions').find({}).toArray();
  let expeditionsMissingYear = 0;
  let expeditionsMissingTitle = 0;
  let expeditionsMissingLeader = 0;
  let expeditionsMissingPorts = 0;
  let expeditionsMissingVessel = 0;
  let expeditionsMissingHighlights = 0;
  let idTypeMismatch = 0;

  expeditions.forEach(e => {
    if (!e.operational_year && !e.year_start && !e.year) expeditionsMissingYear++;
    if (!e.expedition_title && !e.title && !e.name) expeditionsMissingTitle++;
    if (!e.leader_name && !e.leader && !e.source) expeditionsMissingLeader++;
    if (!e.ports || e.ports.length === 0) expeditionsMissingPorts++;
    if (!e.vessel || (Array.isArray(e.vessel) && e.vessel.length === 0)) expeditionsMissingVessel++;
    if (!e.operational_highlights || (Array.isArray(e.operational_highlights) && e.operational_highlights.length === 0)) expeditionsMissingHighlights++;
    if (!e.expedition_id && !e.document_id) idTypeMismatch++;
  });

  findings.push({
    category: 'Expeditions Inconsistencies',
    severity: 'MEDIUM',
    details: {
      total: expeditions.length,
      expeditionsMissingYear,
      expeditionsMissingTitle,
      expeditionsMissingLeader,
      expeditionsMissingPorts,
      expeditionsMissingVessel,
      expeditionsMissingHighlights,
      idTypeMismatch,
      keyInsight: 'In expeditions, IDs are named "document_id" (e.g. exp_054) instead of "expedition_id", and vessel/highlights fields vary between array of strings and single strings.'
    }
  });

  // 4. Deep audit RESEARCHERS
  const researchers = await db.collection('researchers').find({}).toArray();
  const researcherIds = new Set(researchers.map(r => r.researcher_id || r.id));
  console.log('Total researchers in DB:', researchers.length);
  researchers.forEach(r => {
    console.log(`Researcher: ${r.name} | ID: ${r.researcher_id} | Stations: ${JSON.stringify(r.stations)} | Disciplines: ${JSON.stringify(r.disciplines)}`);
  });

  // 5. Deep audit PROJECTS
  const projects = await db.collection('projects').find({}).toArray();
  console.log('\nTotal projects in DB:', projects.length);
  const brokenProjectPointers = [];
  projects.forEach(p => {
    console.log(`Project: ${p.project_code} | Lead ID: ${p.lead_researcher_id} | Stations: ${JSON.stringify(p.station_ids)} | Publications: ${JSON.stringify(p.publication_ids)} | Datasets: ${JSON.stringify(p.dataset_ids)}`);
    if (p.lead_researcher_id && !researcherIds.has(p.lead_researcher_id)) {
      brokenProjectPointers.push(`Project ${p.project_code} points to non-existent researcher ID: ${p.lead_researcher_id}`);
    }
  });

  // 6. Deep audit PUBLICATIONS
  const publications = await db.collection('publications').find({}).toArray();
  console.log('\nTotal publications in DB:', publications.length);
  publications.forEach(pub => {
    console.log(`Publication: ${pub.publication_id} | Title: "${pub.title?.slice(0, 40)}..." | DOI: ${pub.doi} | Project IDs: ${JSON.stringify(pub.project_ids)}`);
  });

  // 7. Deep audit DATASETS
  const datasets = await db.collection('datasets').find({}).toArray();
  console.log('\nTotal datasets in DB:', datasets.length);
  datasets.forEach(d => {
    console.log(`Dataset: ${d.dataset_id} | Title: "${d.title?.slice(0, 40)}..." | Related collection: ${d.related_collection}`);
  });

  // 8. Deep audit MEDIA & PHYSICAL ASSETS
  const media = await db.collection('media').find({}).toArray();
  console.log('\nTotal media records in DB:', media.length);
  const missingMediaFiles = [];
  media.forEach(m => {
    const fileUrl = m.file_url || m.url || m.path;
    if (fileUrl) {
      // Check if file physically exists on disk in 05_media
      const cleanPath = fileUrl.replace(/^\/media\//, '');
      const fullPath = path.join(__dirname, '../05_media', cleanPath);
      if (!fs.existsSync(fullPath)) {
        missingMediaFiles.push({ title: m.title, url: fileUrl, resolvedDiskPath: fullPath });
      }
    } else {
      missingMediaFiles.push({ title: m.title, reason: 'No file_url or url field' });
    }
  });

  // 9. Deep audit FACILITIES
  const facilities = await db.collection('facilities').find({}).toArray();
  console.log('\nTotal facilities in DB:', facilities.length);

  // 10. Deep audit KNOWLEDGE GRAPH (NODES & EDGES)
  const nodes = await db.collection('knowledge_nodes').find({}).toArray();
  const edges = await db.collection('knowledge_edges').find({}).toArray();
  console.log(`Knowledge Graph: ${nodes.length} nodes, ${edges.length} edges`);

  const nodeIds = new Set(nodes.map(n => n.id || n.node_id));
  const brokenEdges = [];
  edges.forEach(e => {
    if (!nodeIds.has(e.source)) brokenEdges.push(`Edge from non-existent source: ${e.source} -> ${e.target}`);
    if (!nodeIds.has(e.target)) brokenEdges.push(`Edge to non-existent target: ${e.source} -> ${e.target}`);
  });

  // 11. Deep audit REVIEWS
  const reviews = await db.collection('reviews').find({}).toArray();
  console.log('\nTotal reviews in DB:', reviews.length);

  // 12. Deep audit USERS
  const users = await db.collection('users').find({}).toArray();
  console.log('Total users in DB:', users.length);
  console.log('User roles:', users.map(u => ({ email: u.email, role: u.role })));

  console.log('\n=== SUMMARY OF DATA PROBLEMS IDENTIFIED ===');
  console.log('1. Station issues count:', stationIssues.length);
  if (stationIssues.length > 0) console.log('   Sample:', stationIssues.slice(0, 5));
  console.log('2. Missing Himadri base in stations:', !indianStationNames.some(n => /himadri/i.test(n)));
  console.log('3. Broken project -> researcher pointers:', brokenProjectPointers);
  console.log('4. Media missing physical files:', missingMediaFiles.length, 'out of', media.length);
  if (missingMediaFiles.length > 0) console.log('   Sample missing media files:', missingMediaFiles.slice(0, 5));
  console.log('5. Broken knowledge graph edges:', brokenEdges.length);
  console.log('6. Dataset counts (sparse data size):', datasets.length, 'datasets in total catalogue');
  console.log('7. Publication count (sparse data size):', publications.length, 'publications in total catalogue');
  console.log('8. Researcher count (sparse data size):', researchers.length, 'researchers in total directory');

  await closeDatabase();
}

auditData().catch(console.error);
