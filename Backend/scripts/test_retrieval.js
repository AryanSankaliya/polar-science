const { MongoClient } = require('mongodb');

async function test() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('polar_hub');
  
  // Search for 41st or 41 in chunks
  const c41 = await db.collection('expedition_chunks').find({
    chunk_text: { $regex: '41st|forty-first|41th', $options: 'i' }
  }).toArray();
  console.log('Chunks mentioning 41st:', c41.length);
  for (const c of c41.slice(0, 3)) {
    console.log(`[${c.source_document} p.${c.page}] ${c.chunk_text.slice(0, 200)}...`);
  }

  // Search for Golovnin
  const cVessels = await db.collection('expedition_chunks').find({
    chunk_text: { $regex: 'Vasiliy Golovnin|Ivan Papanin|Polar Circle', $options: 'i' }
  }).toArray();
  console.log('\nChunks mentioning vessels:', cVessels.length);
  for (const c of cVessels.slice(0, 3)) {
    console.log(`[${c.source_document} p.${c.page}] ${c.chunk_text.slice(0, 200)}...`);
  }

  await client.close();
}

test();
