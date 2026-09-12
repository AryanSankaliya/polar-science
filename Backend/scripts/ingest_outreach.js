/**
 * scripts/ingest_outreach.js
 * Ingestion and Indexing pipeline for Person 6 Polar Outreach records into MongoDB.
 * Target Database: polar_hub
 * Target Collection: outreach_records
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'polar_hub';
const JSON_FILE_PATH = path.join(__dirname, '..', 'cleaned_data', 'clean_outreach.json');

async function ingestOutreachData() {
  console.log('===========================================================================');
  console.log('SIH 2026: Person 6 Polar Outreach MongoDB Ingestion & Indexing Engine');
  console.log('===========================================================================');

  if (!fs.existsSync(JSON_FILE_PATH)) {
    console.error(`[ERROR] Cleaned outreach data file not found at: ${JSON_FILE_PATH}`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(JSON_FILE_PATH, 'utf8');
  const records = JSON.parse(rawJson);
  console.log(`[INFO] Loaded ${records.length} cleaned outreach records from disk.`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log(`[INFO] Connected to MongoDB at: ${MONGODB_URI}`);
    const db = client.db(DB_NAME);

    const collectionName = 'outreach_records';
    const collections = await db.listCollections({ name: collectionName }).toArray();

    // Idempotent drop if collection exists
    if (collections.length > 0) {
      console.log(`[INFO] Dropping existing '${collectionName}' collection for idempotent ingestion...`);
      await db.collection(collectionName).drop();
    }

    const outreachCol = db.collection(collectionName);

    // Insert all documents
    console.log(`[INFO] Inserting ${records.length} records into '${collectionName}'...`);
    const insertResult = await outreachCol.insertMany(records);
    console.log(`[SUCCESS] Inserted ${insertResult.insertedCount} documents successfully.`);

    // Create Indexes
    console.log('[INFO] Building database indexes...');
    
    // 1. Category Index for fast category filtering
    const catIndexResult = await outreachCol.createIndex({ category: 1 }, { name: 'idx_outreach_category' });
    console.log(`       Created single index: ${catIndexResult}`);

    // 2. Full-text search index for Grounded AI and search bar
    const textIndexResult = await outreachCol.createIndex(
      {
        title: 'text',
        description: 'text',
        scientific_fact: 'text',
        tags: 'text'
      },
      {
        name: 'idx_outreach_fulltext',
        weights: {
          title: 10,
          scientific_fact: 5,
          tags: 4,
          description: 2
        }
      }
    );
    console.log(`       Created text index: ${textIndexResult}`);

    // Verification
    const count = await outreachCol.countDocuments();
    const categories = await outreachCol.distinct('category');

    console.log('\n===========================================================================');
    console.log('INGESTION VERIFICATION & METRICS');
    console.log('===========================================================================');
    console.log(`Total verified documents in 'outreach_records': ${count}`);
    console.log(`Distinct categories indexed: ${categories.length}`);
    categories.forEach(c => console.log(`  - ${c}`));

    // Test text search query
    const testQuery = 'penguin';
    const testResults = await outreachCol.find({ $text: { $search: testQuery } }).toArray();
    console.log(`\nVerification Text Search ('${testQuery}'): Matched ${testResults.length} records.`);
    if (testResults.length > 0) {
      console.log(`  -> Top match: ${testResults[0].title} (${testResults[0].id})`);
    }

    console.log('===========================================================================');
  } catch (error) {
    console.error('[FATAL ERROR] Ingestion failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('[INFO] MongoDB connection closed.\n');
  }
}

if (require.main === module) {
  ingestOutreachData();
}

module.exports = { ingestOutreachData };
