const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb+srv://aryansankaliya_db_user:<PASSWORD>@mycluster.bxwcsf5.mongodb.net/SIH-polar_science?retryWrites=true&w=majority&authSource=admin';
const DB_NAME = process.env.DB_NAME || 'SIH-polar_science';

let client = null;
let db = null;

async function connectToDatabase() {
  if (db) {
    return db;
  }
  try {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      retryReads: true,
      retryWrites: true
    });
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`Connected to MongoDB Atlas: ${DB_NAME}`);
    return db;
  } catch (error) {
    console.error(`[DATABASE ERROR] Could not connect to MongoDB Atlas: ${error.message}`);
    throw error;
  }
}

function getDb() {
  if (!db) {
    throw new Error('Database is not initialized. Call connectToDatabase() first.');
  }
  return db;
}

async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('[DATABASE] MongoDB connection closed cleanly.');
  }
}

module.exports = {
  connectToDatabase,
  getDb,
  closeDatabase,
  MONGODB_URI,
  DB_NAME
};

