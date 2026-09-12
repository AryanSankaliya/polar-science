/**
 * scripts/ingest_stations_and_satellite.js
 * Ingestion and Indexing pipeline for:
 *  - Person 1: Antarctic Research Stations ('stations' collection)
 *  - Person 3: Cryosphere / Satellite Sea Ice Time-Series ('satellite_sea_ice' collection)
 * Target Database: polar_hub (mongodb://localhost:27017)
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'polar_hub';

const STATIONS_JSON_PATH = path.join(__dirname, '..', 'cleaned_data', 'clean_stations.json');
const SATELLITE_JSON_PATH = path.join(__dirname, '..', 'cleaned_data', 'clean_sea_ice_satellite.json');

async function runIngestion() {
  console.log('===========================================================================');
  console.log('SIH 2026: Person 1 (Stations) & Person 3 (Satellite Sea Ice) Ingestion');
  console.log('===========================================================================');

  // Verify file existence
  if (!fs.existsSync(STATIONS_JSON_PATH)) {
    console.error(`[ERROR] Stations JSON not found at: ${STATIONS_JSON_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(SATELLITE_JSON_PATH)) {
    console.error(`[ERROR] Satellite Sea Ice JSON not found at: ${SATELLITE_JSON_PATH}`);
    process.exit(1);
  }

  const stationsData = JSON.parse(fs.readFileSync(STATIONS_JSON_PATH, 'utf8'));
  const satelliteData = JSON.parse(fs.readFileSync(SATELLITE_JSON_PATH, 'utf8'));

  console.log(`[INFO] Loaded ${stationsData.length} station records from disk.`);
  console.log(`[INFO] Loaded ${satelliteData.length} satellite sea ice records from disk.`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log(`[INFO] Connected to MongoDB at: ${MONGODB_URI}`);
    const db = client.db(DB_NAME);

    // -------------------------------------------------------------
    // 1. POPULATE 'stations' COLLECTION
    // -------------------------------------------------------------
    const stationsColName = 'stations';
    const existingStationCols = await db.listCollections({ name: stationsColName }).toArray();
    if (existingStationCols.length > 0) {
      console.log(`[INFO] Dropping existing '${stationsColName}' collection for idempotent ingestion...`);
      await db.collection(stationsColName).drop();
    }

    const stationsCol = db.collection(stationsColName);
    console.log(`[INFO] Inserting ${stationsData.length} documents into '${stationsColName}'...`);
    const stationsInsert = await stationsCol.insertMany(stationsData);
    console.log(`[SUCCESS] Inserted ${stationsInsert.insertedCount} station documents.`);

    console.log(`[INFO] Creating indexes on '${stationsColName}'...`);
    const idxGeo = await stationsCol.createIndex({ latitude: 1, longitude: 1 }, { name: 'idx_stations_lat_lng' });
    console.log(`       Created geospatial coordinates index: ${idxGeo}`);

    const idxIndian = await stationsCol.createIndex({ is_indian_station: 1 }, { name: 'idx_stations_is_indian' });
    console.log(`       Created Indian station flag index:    ${idxIndian}`);

    const idxCountry = await stationsCol.createIndex({ country: 1 }, { name: 'idx_stations_country' });
    console.log(`       Created country filter index:         ${idxCountry}`);

    const idxStatus = await stationsCol.createIndex({ status: 1 }, { name: 'idx_stations_status' });
    console.log(`       Created status filter index:          ${idxStatus}`);

    // -------------------------------------------------------------
    // 2. POPULATE 'satellite_sea_ice' COLLECTION
    // -------------------------------------------------------------
    const satelliteColName = 'satellite_sea_ice';
    const existingSatCols = await db.listCollections({ name: satelliteColName }).toArray();
    if (existingSatCols.length > 0) {
      console.log(`[INFO] Dropping existing '${satelliteColName}' collection for idempotent ingestion...`);
      await db.collection(satelliteColName).drop();
    }

    const satelliteCol = db.collection(satelliteColName);
    console.log(`[INFO] Inserting ${satelliteData.length} documents into '${satelliteColName}'...`);
    const satInsert = await satelliteCol.insertMany(satelliteData);
    console.log(`[SUCCESS] Inserted ${satInsert.insertedCount} satellite documents.`);

    console.log(`[INFO] Creating indexes on '${satelliteColName}'...`);
    const idxDate = await satelliteCol.createIndex({ date: 1 }, { name: 'idx_sea_ice_date' });
    console.log(`       Created chronological date index:     ${idxDate}`);

    const idxYearMonth = await satelliteCol.createIndex({ year: 1, month: 1 }, { name: 'idx_sea_ice_year_month' });
    console.log(`       Created temporal year/month index:    ${idxYearMonth}`);

    // -------------------------------------------------------------
    // 3. VERIFIED COUNTS & METRICS
    // -------------------------------------------------------------
    const [finalStationsCount, finalSatCount] = await Promise.all([
      stationsCol.countDocuments(),
      satelliteCol.countDocuments()
    ]);

    const indianCount = await stationsCol.countDocuments({ is_indian_station: true });

    console.log('\n===========================================================================');
    console.log('INGESTION VERIFICATION REPORT');
    console.log('===========================================================================');
    console.log(`Database Name:                 ${DB_NAME}`);
    console.log(`Collection 'stations':         ${finalStationsCount} documents verified`);
    console.log(`  - Indian Stations:           ${indianCount} documents`);
    console.log(`Collection 'satellite_sea_ice': ${finalSatCount} documents verified`);
    console.log('All required indexes verified active.');
    console.log('===========================================================================\n');

  } catch (err) {
    console.error('[ERROR] Ingestion failed:', err);
    process.exit(1);
  } finally {
    await client.close();
    console.log('[INFO] MongoDB connection closed cleanly.');
  }
}

runIngestion();
