/**
 * Automated Verification Script for SIH 2026 Polar AI Microservice
 * Tests:
 * 1. Health Endpoint (GET /health)
 * 2. Missing Question Validation (POST /api/query -> 400)
 * 3. Empty String Validation (POST /api/query -> 400)
 * 4. API Key presence or clean 503 response
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:5001';

async function runTests() {
  console.log(`\n🧪 Running Automated Verification Tests against ${BASE_URL}...\n`);
  let passed = 0;
  let total = 0;

  async function assertTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}: ${err.message}`);
    }
  }

  // Test 1: Health endpoint
  await assertTest('GET /health returns 200 and healthy status', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    const data = await res.json();
    if (data.status !== 'healthy') throw new Error(`Expected status 'healthy', got '${data.status}'`);
    if (typeof data.port !== 'number') throw new Error('Expected numeric port in health payload');
  });

  // Test 2: Validation on missing question
  await assertTest('POST /api/query with empty payload returns 400', async () => {
    const res = await fetch(`${BASE_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
    const data = await res.json();
    if (data.success !== false) throw new Error('Expected success: false');
    if (!data.error.includes('Missing required field')) throw new Error(`Unexpected error message: ${data.error}`);
  });

  // Test 3: Validation on whitespace question
  await assertTest('POST /api/query with whitespace question returns 400', async () => {
    const res = await fetch(`${BASE_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '    ' })
    });
    if (res.status !== 400) throw new Error(`Expected status 400, got ${res.status}`);
    const data = await res.json();
    if (data.success !== false) throw new Error('Expected success: false');
  });

  // Test 4: Check query handling (handles missing key cleanly or generates response if key is present)
  await assertTest('POST /api/query handles request gracefully (200 with answer or 503 clean error)', async () => {
    const res = await fetch(`${BASE_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'What is the mean salinity of the Southern Ocean?',
        mode: 'student'
      })
    });

    const data = await res.json();
    if (res.status === 200) {
      if (!data.success) throw new Error('Expected success: true');
      if (!data.answer) throw new Error('Expected answer string in response');
      if (!Array.isArray(data.citations) || data.citations.length === 0) throw new Error('Expected citations array');
      console.log(`   ℹ️ Generated answer preview: "${data.answer.substring(0, 100)}..."`);
    } else if (res.status === 503) {
      if (data.success !== false) throw new Error('Expected success: false on missing key');
      console.log('   ℹ️ Correctly returned graceful 503 error for unconfigured key without crashing.');
    } else {
      throw new Error(`Unexpected status code: ${res.status} (${JSON.stringify(data)})`);
    }
  });

  console.log(`\n====================================================`);
  console.log(`📊 Test Results: ${passed}/${total} passed`);
  console.log(`====================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
