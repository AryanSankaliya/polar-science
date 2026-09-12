const mongoose = require('mongoose');
require('dotenv').config();

async function updateAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/polaris');
    const user = await mongoose.connection.collection('users').findOne({ email: 'admin@gmail.com' });
    console.log('Current DB admin user:', user);
    if (user) {
      await mongoose.connection.collection('users').updateOne(
        { email: 'admin@gmail.com' },
        { $set: { name: 'Admin' } }
      );
      console.log('Successfully updated admin user name to Admin in MongoDB!');
    }
    await mongoose.disconnect();
  } catch (e) {
    console.log('DB result:', e.message);
  }
}

updateAdmin();
