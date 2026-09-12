const { connectToDatabase, getDb, closeDatabase, MONGODB_URI, DB_NAME } = require('./Configuration/database');

module.exports = {
  connectToDatabase,
  getDb,
  closeDatabase,
  MONGODB_URI,
  DB_NAME
};
