const { connectToDatabase, closeDatabase } = require('../Configuration/database');
const fs = require('fs');
const path = require('path');

async function checkMedia() {
  const db = await connectToDatabase();
  const media = await db.collection('media_gallery').find({}).toArray();
  console.log('Media count in media_gallery:', media.length);
  let missing = 0;
  let exists = 0;
  media.forEach(m => {
    const url = m.url || m.file_url || m.path;
    if (url) {
      const rel = url.replace(/^\/media\//, '').replace(/^\//, '');
      const full = path.join(__dirname, '../05_media', rel);
      const fileExists = fs.existsSync(full);
      if (fileExists) {
        exists++;
        console.log(`[EXISTS] ${m.title} -> ${url}`);
      } else {
        missing++;
        console.log(`[MISSING] ${m.title} -> ${url} (tried: ${full})`);
      }
    } else {
      console.log(`[NO_URL] ${m.title}`);
    }
  });
  console.log(`Total exists: ${exists}, Total missing: ${missing}`);
  await closeDatabase();
}

checkMedia();
