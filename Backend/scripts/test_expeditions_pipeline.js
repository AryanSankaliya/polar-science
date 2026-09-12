const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(70));
  console.log(' POLAR SCIENCE HUB - EXPEDITIONS API & GROUNDED AI TEST SUITE');
  console.log('='.repeat(70));

  let allPassed = true;

  // 1. Health Check
  try {
    const health = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    });
    console.log(`\n[TEST 0] GET /api/health -> Status: ${health.status} (${health.body.status})`);
  } catch (err) {
    console.error('Failed to reach backend server:', err.message);
    process.exit(1);
  }

  // 2. TEST 1: GET /api/v1/expeditions
  try {
    console.log('\n[TEST 1] Testing GET /api/v1/expeditions');
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/expeditions',
      method: 'GET'
    });

    const is200 = res.status === 200;
    const hasData = res.body.success === true && Array.isArray(res.body.data) && res.body.data.length > 0;
    const hasStats = res.body.stats && res.body.stats.total_expeditions_tracked > 0;

    console.log(`  - HTTP Status: ${res.status} (Expected: 200) -> ${is200 ? 'PASS' : 'FAIL'}`);
    console.log(`  - Success flag: ${res.body.success}`);
    console.log(`  - Total count: ${res.body.count}`);
    console.log(`  - Dynamic Stats:`, res.body.stats);
    console.log(`  - First doc ID: ${res.body.data[0]?.document_id} (${res.body.data[0]?.expedition_number || 'N/A'})`);

    if (!is200 || !hasData || !hasStats) allPassed = false;
  } catch (err) {
    console.error('TEST 1 Error:', err.message);
    allPassed = false;
  }

  // 3. Filtered Search Tests
  try {
    console.log('\n[TEST 1B] Testing GET /api/v1/expeditions?search=Maitri');
    const resSearch = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/expeditions?search=Maitri',
      method: 'GET'
    });
    console.log(`  - Filtered results for 'Maitri': ${resSearch.body.count} records`);

    console.log('\n[TEST 1C] Testing GET /api/v1/expeditions?vessel=Polar%20Circle');
    const resVessel = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/expeditions?vessel=Polar%20Circle',
      method: 'GET'
    });
    console.log(`  - Filtered results for 'Polar Circle': ${resVessel.body.count} records`);
  } catch (err) {
    console.error('TEST 1B/1C Error:', err.message);
    allPassed = false;
  }

  // 4. TEST 2: GET /api/v1/expeditions/:id
  try {
    console.log('\n[TEST 2] Testing GET /api/v1/expeditions/exp_001');
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/expeditions/exp_001',
      method: 'GET'
    });

    const is200 = res.status === 200;
    const exp = res.body.data;
    const hasMetadata = exp && exp.document_id === 'exp_001';
    const hasChunks = Array.isArray(exp?.chunks) && exp.chunks.length > 0;
    const chunkSample = hasChunks ? exp.chunks[0] : null;

    console.log(`  - HTTP Status: ${res.status} (Expected: 200) -> ${is200 ? 'PASS' : 'FAIL'}`);
    console.log(`  - Document ID: ${exp?.document_id} (${exp?.source_document})`);
    console.log(`  - Expedition Title: ${exp?.expedition_title}`);
    console.log(`  - Chunks retrieved: ${exp?.chunks?.length || 0}`);
    if (chunkSample) {
      console.log(`  - Chunk sample ID: ${chunkSample.chunk_id}`);
      console.log(`  - Source doc: ${chunkSample.source_document}, Page: ${chunkSample.page}`);
      console.log(`  - Chunk excerpt: "${chunkSample.chunk_text?.slice(0, 100)}..."`);
    }

    if (!is200 || !hasMetadata || !hasChunks) allPassed = false;
  } catch (err) {
    console.error('TEST 2 Error:', err.message);
    allPassed = false;
  }

  // 5. TEST 3: POST /api/v1/ai/query (Grounding query)
  try {
    console.log('\n[TEST 3] Testing POST /api/v1/ai/query for 41st Expedition');
    const postPayload = {
      question: "Which vessel was used in the 41st Indian Antarctic Expedition and what were the logistics?",
      domain: "expedition"
    };

    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/ai/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, postPayload);

    const is200 = res.status === 200;
    const answer = res.body.answer || '';
    const evidence = res.body.evidence || {};
    const sources = evidence.sources || [];

    console.log(`  - HTTP Status: ${res.status} (Expected: 200) -> ${is200 ? 'PASS' : 'FAIL'}`);
    console.log(`  - Domain identified: ${res.body.domain}`);
    console.log(`  - Grounded Answer:\n    "${answer}"`);
    console.log(`  - Retrieved Chunks Count: ${evidence.retrieved_chunks_count}`);
    console.log(`  - Evidence Sources Cited: ${sources.length}`);
    if (sources.length > 0) {
      console.log(`  - Top citation: [Source: ${sources[0].source_document}, Page ${sources[0].page_number}]`);
    }

    const citationsFound = answer.includes('[Source:') && answer.includes('Page');
    console.log(`  - Explicit citation present: ${citationsFound ? 'YES' : 'NO'}`);

    if (!is200 || !answer) allPassed = false;
  } catch (err) {
    console.error('TEST 3 Error:', err.message);
    allPassed = false;
  }

  // 6. TEST 4: Existing Ocean/Paleoclimate query preserved
  try {
    console.log('\n[TEST 4] Testing Existing Scientific Query Preservation');
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/ai/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, { query: "Why does CDW water warm up between 200m and 800m depth?" });

    const is200 = res.status === 200;
    const answer = res.body.answer || '';
    console.log(`  - HTTP Status: ${res.status} -> ${is200 ? 'PASS' : 'FAIL'}`);
    console.log(`  - Domain: ${res.body.domain}`);
    console.log(`  - CDW scientific answer present: ${answer.includes('Circumpolar Deep Water') ? 'YES' : 'NO'}`);

    if (!is200 || !answer.includes('Circumpolar Deep Water')) allPassed = false;
  } catch (err) {
    console.error('TEST 4 Error:', err.message);
    allPassed = false;
  }

  console.log('\n' + '='.repeat(70));
  console.log(` ALL ENDPOINT & GROUNDED AI TESTS: ${allPassed ? 'ALL PASSED (100%)' : 'SOME FAILED'}`);
  console.log('='.repeat(70));
}

runTests();
