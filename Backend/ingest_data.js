const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'polar_hub';

function resolveFilePath(relativePath) {
  const candidates = [
    path.join(__dirname, relativePath),
    path.join(__dirname, relativePath.replace('polar-data/', '')),
    path.join(__dirname, 'polar-data', relativePath)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  throw new Error(`Could not resolve data file: ${relativePath}`);
}

async function ingestData() {
  console.log('='.repeat(70));
  console.log(' Polar Science Hub - MongoDB Automated Ingestion');
  console.log('='.repeat(70));
  console.log(`Connecting to MongoDB URI: ${MONGODB_URI}`);
  console.log(`Target Database:          ${DB_NAME}`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected successfully to MongoDB server.');

    const db = client.db(DB_NAME);

    // 1. Ingest Southern Ocean Data
    const oceanPath = resolveFilePath('polar-data/cleaned_data/clean_southern_ocean.json');
    console.log(`\nReading Ocean Data from: ${oceanPath}`);
    const oceanData = JSON.parse(fs.readFileSync(oceanPath, 'utf8'));
    console.log(`Parsed ${oceanData.length.toLocaleString()} ocean records from JSON.`);

    const oceanCol = db.collection('scientific_oceans');
    // Drop existing collection to ensure no duplicates
    const oceanExists = await db.listCollections({ name: 'scientific_oceans' }).hasNext();
    if (oceanExists) {
      await oceanCol.drop();
      console.log("Dropped existing 'scientific_oceans' collection to prevent duplication.");
    }
    const oceanInsertResult = await oceanCol.insertMany(oceanData);
    console.log(`Inserted ${oceanInsertResult.insertedCount.toLocaleString()} documents into 'scientific_oceans'.`);

    // Create index on coordinates and depth
    await oceanCol.createIndex({ latitude: 1, longitude: 1, depth: 1 });
    console.log("Created index on 'scientific_oceans' (latitude, longitude, depth).");

    // 2. Ingest Ice Core Data
    const icePath = resolveFilePath('polar-data/cleaned_data/clean_ice_core.json');
    console.log(`\nReading Ice Core Data from: ${icePath}`);
    const iceData = JSON.parse(fs.readFileSync(icePath, 'utf8'));
    console.log(`Parsed ${iceData.length.toLocaleString()} ice core records from JSON.`);

    const iceCol = db.collection('scientific_ice_cores');
    // Drop existing collection to ensure no duplicates
    const iceExists = await db.listCollections({ name: 'scientific_ice_cores' }).hasNext();
    if (iceExists) {
      await iceCol.drop();
      console.log("Dropped existing 'scientific_ice_cores' collection to prevent duplication.");
    }
    const iceInsertResult = await iceCol.insertMany(iceData);
    console.log(`Inserted ${iceInsertResult.insertedCount.toLocaleString()} documents into 'scientific_ice_cores'.`);

    // Create index on age_year_bp
    await iceCol.createIndex({ age_year_bp: 1 });
    console.log("Created index on 'scientific_ice_cores' (age_year_bp).");

    console.log('\n' + '='.repeat(70));
    console.log(' DATABASE INGESTION COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log(`Total 'scientific_oceans' documents:     ${await oceanCol.countDocuments()}`);
    console.log(`Total 'scientific_ice_cores' documents:  ${await iceCol.countDocuments()}`);
  } catch (error) {
    console.error('Ingestion failed:', error);
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

if (require.main === module) {
  ingestData();
}

module.exports = { ingestData };
