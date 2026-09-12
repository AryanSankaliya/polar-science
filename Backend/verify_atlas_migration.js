const { connectToDatabase, closeDatabase, getDb } = require('./Configuration/database');
const stationService = require('./Services/StationService');
const datasetService = require('./Services/DatasetService');
const weatherController = require('./controllers/WeatherController');
const expeditionService = require('./Services/ExpeditionService');
const scienceController = require('./controllers/ScienceController');
const mediaService = require('./Services/MediaService');
const researcherService = require('./Services/ResearcherService');
const publicationService = require('./Services/PublicationService');
const knowledgeGraphService = require('./Services/KnowledgeGraphService');

async function testMigration() {
  console.log('='.repeat(70));
  console.log('VERIFYING MONGODB ATLAS MIGRATION: SIH-polar_science');
  console.log('='.repeat(70));

  try {
    const db = await connectToDatabase();
    console.log('✓ Successfully connected to MongoDB Atlas!');

    // 1. Stations API Test
    console.log('\n--- 1. Testing Stations API ---');
    const stationsResult = await stationService.getStations({ realm: 'antarctica' });
    console.log(`Fetched ${stationsResult.stations.length} Antarctic stations (Total: ${stationsResult.total}).`);
    if (stationsResult.stations.length > 0) {
      const sampleStation = stationsResult.stations[0];
      console.log('Sample Station:', {
        name: sampleStation.name,
        coordinates: sampleStation.coordinates,
        _id_exists: '_id' in sampleStation
      });
      if ('_id' in sampleStation) throw new Error('_id was not stripped from station');
      if (!sampleStation.coordinates || sampleStation.coordinates.lat === undefined) throw new Error('coordinates { lat, lng } structure missing');
    }

    // 2. Datasets API Test
    console.log('\n--- 2. Testing Datasets API ---');
    const datasetsResult = await datasetService.getDatasets({ category: '01_Weather' });
    console.log(`Fetched ${datasetsResult.datasets.length} datasets for category '01_Weather'.`);
    if (datasetsResult.datasets.length > 0) {
      const sampleDataset = datasetsResult.datasets[0];
      console.log('Sample Dataset:', {
        title: sampleDataset.title,
        downloadUrl: sampleDataset.downloadUrl,
        isSingleFile: sampleDataset.isSingleFile,
        primaryFile: sampleDataset.primaryFile,
        _id_exists: '_id' in sampleDataset
      });
      if ('_id' in sampleDataset) throw new Error('_id was not stripped from dataset');
      if (!sampleDataset.downloadUrl || sampleDataset.isSingleFile === undefined || !sampleDataset.primaryFile) {
        throw new Error('downloadUrl, isSingleFile, or primaryFile missing from dataset');
      }
    }

    // 3. Weather & Live Telemetry API Test
    console.log('\n--- 3. Testing Weather & Live Telemetry API ---');
    let weatherData = null;
    const reqMock = { query: { station: 'Maitri', limit: '24' } };
    const resMock = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { weatherData = payload; return this; }
    };
    await weatherController.getWeatherTelemetry(reqMock, resMock);
    console.log(`Fetched ${Array.isArray(weatherData) ? weatherData.length : 0} weather telemetry records for Maitri.`);
    if (Array.isArray(weatherData) && weatherData.length > 0) {
      const sampleWeather = weatherData[0];
      console.log('Sample Weather Reading:', {
        station: sampleWeather.station,
        air_temperature_celsius: sampleWeather.air_temperature_celsius,
        air_temp_type: typeof sampleWeather.air_temperature_celsius,
        wind_direction_deg: sampleWeather.wind_direction_deg,
        wind_dir_type: typeof sampleWeather.wind_direction_deg,
        _id_exists: '_id' in sampleWeather
      });
      if ('_id' in sampleWeather) throw new Error('_id was not stripped from weather reading');
      if (typeof sampleWeather.air_temperature_celsius !== 'number' || typeof sampleWeather.wind_direction_deg !== 'number') {
        throw new Error('air_temperature_celsius or wind_direction_deg is not float');
      }
    }

    // 4. Expeditions & Timeline API Test
    console.log('\n--- 4. Testing Expeditions & Timeline API ---');
    const expeditionsResult = await expeditionService.getExpeditions({});
    console.log(`Fetched ${expeditionsResult.expeditions.length} expeditions.`);
    const timelineResult = await expeditionService.getExpeditionTimeline();
    console.log(`Fetched ${timelineResult.length} timeline entries.`);

    // 5. Scientific Visualizer API Test
    console.log('\n--- 5. Testing Scientific Visualizer API ---');
    let visualizerData = null;
    const visResMock = {
      status(code) { this.statusCode = code; return this; },
      json(payload) { visualizerData = payload; return this; }
    };
    await scienceController.getVisualizerDatasets({}, visResMock);
    console.log(`Fetched visualizer datasets count: ${visualizerData ? visualizerData.count : 0}`);

    // 6. Media Gallery, Researchers & Publications Test
    console.log('\n--- 6. Testing Media Gallery, Researchers & Publications ---');
    const mediaResult = await mediaService.getMedia({ media_type: 'photo' });
    console.log(`Fetched ${mediaResult.media.length} media records with media_type=photo.`);
    const researchersResult = await researcherService.getResearchers({});
    console.log(`Fetched ${researchersResult.researchers.length} researchers.`);
    const publicationsResult = await publicationService.getPublications({ keyword: 'ice' });
    console.log(`Fetched ${publicationsResult.publications.length} publications with keyword='ice'.`);

    // 7. Knowledge Graph Test
    console.log('\n--- 7. Testing Knowledge Graph API ---');
    const graphResult = await knowledgeGraphService.getGraph({});
    console.log(`Knowledge Graph Nodes: ${graphResult.nodes_count}, Edges: ${graphResult.edges_count}`);

    console.log('\n' + '='.repeat(70));
    console.log('ALL MONGODB ATLAS MIGRATION CHECKS PASSED SUCCESSFULLY!');
    console.log('='.repeat(70));
  } catch (err) {
    console.error('\n❌ MIGRATION TEST FAILED:', err);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

testMigration();
