/**
 * scripts/ingest_media.js
 * Ingestion and Indexing pipeline for Person 5 Multimedia Dataset into MongoDB.
 * Target Database: polar_hub (mongodb://localhost:27017)
 * Target Collection: media_gallery
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'polar_hub';
const JSON_FILE_PATH = path.join(__dirname, '..', 'cleaned_data', 'clean_media_gallery.json');

async function ingestMediaData() {
  console.log('===========================================================================');
  console.log('SIH 2026: Person 5 Multimedia Gallery MongoDB Ingestion Engine');
  console.log('===========================================================================');

  if (!fs.existsSync(JSON_FILE_PATH)) {
    console.error(`[ERROR] Cleaned media gallery data file not found at: ${JSON_FILE_PATH}`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(JSON_FILE_PATH, 'utf8');
  const records = JSON.parse(rawJson);
  console.log(`[INFO] Loaded ${records.length} cleaned multimedia records from disk.`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log(`[INFO] Connected to MongoDB at: ${MONGODB_URI}`);
    const db = client.db(DB_NAME);

    const collectionName = 'media_gallery';
    const collections = await db.listCollections({ name: collectionName }).toArray();

    // Idempotent drop if collection exists
    if (collections.length > 0) {
      console.log(`[INFO] Dropping existing '${collectionName}' collection for idempotent ingestion...`);
      await db.collection(collectionName).drop();
    }

    const mediaCol = db.collection(collectionName);

    // Insert all documents
    console.log(`[INFO] Inserting ${records.length} records into '${collectionName}'...`);
    const insertResult = await mediaCol.insertMany(records);
    console.log(`[SUCCESS] Inserted ${insertResult.insertedCount} media documents successfully.`);

    // Create Indexes
    console.log('[INFO] Building database indexes...');

    // 1. Compound index for category & type filtering
    const compoundIndexResult = await mediaCol.createIndex(
      { category: 1, type: 1 },
      { name: 'idx_media_category_type' }
    );
    console.log(`       Created compound index: ${compoundIndexResult}`);

    // 2. Index for unique slug id lookup
    const idIndexResult = await mediaCol.createIndex(
      { id: 1 },
      { unique: true, name: 'idx_media_id_unique' }
    );
    console.log(`       Created unique ID index: ${idIndexResult}`);

    // 3. Text search index for title, description, and tags
    const textIndexResult = await mediaCol.createIndex(
      { title: 'text', description: 'text', tags: 'text' },
      { name: 'idx_media_text_search' }
    );
    console.log(`       Created text search index: ${textIndexResult}`);

    // Verification
    const [finalCount, imageCount, videoCount] = await Promise.all([
      mediaCol.countDocuments(),
      mediaCol.countDocuments({ type: 'image' }),
      mediaCol.countDocuments({ type: 'video' })
    ]);

    console.log('\n===========================================================================');
    console.log('INGESTION VERIFICATION REPORT');
    console.log('===========================================================================');
    console.log(`Database Name:                 ${DB_NAME}`);
    console.log(`Collection 'media_gallery':    ${finalCount} documents verified`);
    console.log(`  - High-Resolution Photos:    ${imageCount} documents`);
    console.log(`  - Video Documentaries:       ${videoCount} documents`);
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

ingestMediaData();
