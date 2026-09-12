const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'polar_hub';

function resolveFilePath(relativePath) {
  const candidates = [
    path.join(__dirname, '..', relativePath),
    path.join(__dirname, '..', relativePath.replace('polar-data/', '')),
    path.join(__dirname, '..', 'polar-data', relativePath)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c;
    }
  }
  throw new Error(`Could not resolve data file: ${relativePath}`);
}

async function ingestExpeditions() {
  console.log('='.repeat(70));
  console.log(' Polar Science Hub - Expeditions & Logistics MongoDB Ingestion');
  console.log(' Person 4: Indian Antarctic Expeditions & Logistics');
  console.log('='.repeat(70));
  console.log(`Connecting to MongoDB URI: ${MONGODB_URI}`);
  console.log(`Target Database:          ${DB_NAME}`);

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('MongoDB connection: SUCCESS\n');

    const db = client.db(DB_NAME);

    // -----------------------------------------------------------------
    // 1. Ingest Structured Expeditions Data
    // -----------------------------------------------------------------
    const expPath = resolveFilePath('polar-data/cleaned_data/clean_expeditions.json');
    console.log(`Reading Expeditions Data from: ${expPath}`);
    const expRaw = fs.readFileSync(expPath, 'utf8');
    const expData = JSON.parse(expRaw);

    if (!Array.isArray(expData)) {
      throw new Error('clean_expeditions.json must contain a JSON array');
    }
    console.log(`Found ${expData.length} structured expedition records in JSON.`);

    const expCol = db.collection('expeditions');
    const expExists = await db.listCollections({ name: 'expeditions' }).hasNext();
    if (expExists) {
      await expCol.drop();
      console.log("Safely dropped existing 'expeditions' collection for idempotent ingestion.");
    }

    const expResult = await expCol.insertMany(expData);
    console.log('\nexpeditions:');
    console.log('Expected: ~87');
    console.log(`Inserted: ${expResult.insertedCount}`);

    // Create indexes for expeditions
    await expCol.createIndex({ expedition_number: 1 });
    await expCol.createIndex({ operational_year: 1 });
    await expCol.createIndex({ vessel: 1 });
    console.log("Created indexes on 'expeditions': { expedition_number: 1 }, { operational_year: 1 }, { vessel: 1 }");

    // -----------------------------------------------------------------
    // 2. Ingest Grounded Expedition Evidence Chunks
    // -----------------------------------------------------------------
    const chunksPath = resolveFilePath('polar-data/cleaned_data/clean_expedition_chunks.json');
    console.log(`\nReading Expedition Chunks from: ${chunksPath}`);
    const chunksRaw = fs.readFileSync(chunksPath, 'utf8');
    const chunksData = JSON.parse(chunksRaw);

    if (!Array.isArray(chunksData)) {
      throw new Error('clean_expedition_chunks.json must contain a JSON array');
    }
    console.log(`Found ${chunksData.length} evidence chunks in JSON.`);

    // Inspect & normalize fields: ensure chunk_text is always present
    const normalizedChunks = chunksData.map((c) => ({
      chunk_id: c.chunk_id,
      document_id: c.document_id,
      source_document: c.source_document,
      page: c.page !== undefined ? c.page : (c.page_number !== undefined ? c.page_number : null),
      page_number: c.page_number !== undefined ? c.page_number : (c.page !== undefined ? c.page : null),
      chunk_text: c.chunk_text || c.text || "",
      created_at: new Date()
    }));

    const chunkCol = db.collection('expedition_chunks');
    const chunkExists = await db.listCollections({ name: 'expedition_chunks' }).hasNext();
    if (chunkExists) {
      await chunkCol.drop();
      console.log("Safely dropped existing 'expedition_chunks' collection for idempotent ingestion.");
    }

    // Insert in batches of 1,000 for high efficiency and memory safety
    const BATCH_SIZE = 1000;
    let totalChunksInserted = 0;
    for (let i = 0; i < normalizedChunks.length; i += BATCH_SIZE) {
      const batch = normalizedChunks.slice(i, i + BATCH_SIZE);
      const batchRes = await chunkCol.insertMany(batch);
      totalChunksInserted += batchRes.insertedCount;
    }

    console.log('\nExpeditions:');
    console.log('Expected: approximately 87');
    console.log(`Inserted: ${expResult.insertedCount}`);

    console.log('\nExpedition chunks:');
    console.log('Expected: approximately 1,897');
    console.log(`Inserted: ${totalChunksInserted}`);

    // Create text index for full-text keyword retrieval
    console.log('\nCreating text index on chunk_text and source_document...');
    await chunkCol.createIndex(
      { chunk_text: 'text', source_document: 'text' },
      { name: 'ChunkText_SourceDoc_TextIndex', weights: { chunk_text: 5, source_document: 2 } }
    );
    // Create lookup indexes
    await chunkCol.createIndex({ document_id: 1 });
    await chunkCol.createIndex({ source_document: 1 });
    console.log("Created lookup indexes on 'expedition_chunks': { document_id: 1 }, { source_document: 1 }");

    // Verification check
    const finalExpCount = await expCol.countDocuments();
    const finalChunkCount = await chunkCol.countDocuments();
    const expIndexes = await expCol.indexes();
    const chunkIndexes = await chunkCol.indexes();

    console.log('\n' + '='.repeat(70));
    console.log(' MONGODB INGESTION SUMMARY');
    console.log('='.repeat(70));
    console.log(`Expeditions:`);
    console.log(`Expected: approximately 87`);
    console.log(`Inserted: ${finalExpCount}`);
    console.log(`\nExpedition chunks:`);
    console.log(`Expected: approximately 1,897`);
    console.log(`Inserted: ${finalChunkCount}`);
    console.log(`\nIndexes:`);
    console.log(`- expeditions: ${expIndexes.map(i => i.name).join(', ')}`);
    console.log(`- expedition_chunks: ${chunkIndexes.map(i => i.name).join(', ')}`);

    if (finalExpCount !== expData.length || finalChunkCount !== chunksData.length) {
      console.warn('WARNING: Document counts do not match source files exactly!');
    } else {
      console.log('\nAll source records and grounded chunks ingested with 100% integrity!');
    }

  } catch (error) {
    console.error('Ingestion failed:', error);
    process.exitCode = 1;
  } finally {
    await client.close();
    console.log('\nMongoDB connection closed.');
  }
}

if (require.main === module) {
  ingestExpeditions();
}

module.exports = { ingestExpeditions };
