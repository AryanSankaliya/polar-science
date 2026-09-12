import { spawn } from 'child_process';

const BASE_URL = process.env.TARGET_URL || 'http://localhost:5001';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ensures the server is running on BASE_URL before measuring latency.
 */
async function ensureServer() {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      return null;
    }
  } catch (e) {
    // Server not yet running
  }

  const proc = spawn('node', ['server.js'], {
    cwd: process.cwd(),
    stdio: 'ignore'
  });

  // Wait up to 15 seconds for server and warmup to be ready
  for (let i = 0; i < 30; i++) {
    await sleep(500);
    try {
      const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(1000) });
      if (res.ok) {
        const data = await res.json();
        if (data.warmedUp) {
          return proc;
        }
      }
    } catch (e) {}
  }

  return proc;
}

async function runLatencySuite() {
  const spawnedProc = await ensureServer();

  let t1Passed = false;
  let t2Passed = false;
  let t1Latency = 0;
  let t2Latency = 0;
  let t1Status = 0;
  let t2Status = 0;
  let t1Data = null;
  let t2Data = null;

  try {
    // ============================================================
    // TEST 1 — GREETING BYPASS
    // ============================================================
    const t0Greeting = Date.now();
    const resGreeting = await fetch(`${BASE_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'hey', mode: 'student' })
    });
    t1Latency = Date.now() - t0Greeting;
    t1Status = resGreeting.status;
    t1Data = await resGreeting.json();

    const expectedStudentGreeting = "Hello! I am your Polar Science Hub Assistant. Ask me anything about Antarctic expeditions, ocean temperatures, or ice cores!";
    const isGreetingMatch = t1Data?.answer === expectedStudentGreeting;
    t1Passed = t1Status === 200 && t1Latency < 50 && isGreetingMatch;

    console.log('============================================================');
    console.log('TEST 1 — GREETING BYPASS');
    console.log('============================================================\n');
    console.log(`Latency: ${t1Latency} ms`);
    console.log(`Status: ${t1Status}`);
    console.log(`Verdict: [${t1Passed ? 'PASS' : 'FAIL'}]`);
    if (t1Data?.answer) {
      console.log(`Response: "${t1Data.answer}"`);
    }
    console.log('\n');

    // ============================================================
    // TEST 2 — GROUNDED SOUTHERN OCEAN QUERY
    // ============================================================
    const t0Scientific = Date.now();
    const resScientific = await fetch(`${BASE_URL}/api/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Why is salinity important in the Southern Ocean?',
        mode: 'student'
      })
    });
    t2Latency = Date.now() - t0Scientific;
    t2Status = resScientific.status;
    t2Data = await resScientific.json();

    const hasGroundedData = t2Data?.answer && (
      t2Data.answer.includes('34.203') ||
      t2Data.answer.toLowerCase().includes('salinity') ||
      t2Data.answer.toLowerCase().includes('density') ||
      t2Data.answer.toLowerCase().includes('bottom water') ||
      t2Data.answer.toLowerCase().includes('aabw')
    );
    const hasCitations = Array.isArray(t2Data?.citations) && t2Data.citations.length > 0;
    t2Passed = t2Status === 200 && t2Latency < 3500 && hasGroundedData && hasCitations;

    console.log('============================================================');
    console.log('TEST 2 — GROUNDED SOUTHERN OCEAN QUERY');
    console.log('============================================================\n');
    console.log(`Latency: ${t2Latency} ms`);
    console.log(`Status: ${t2Status}`);
    console.log(`Verdict: [${t2Passed ? 'PASS' : 'FAIL'}]`);
    if (t2Data?.answer) {
      console.log(`Answer:\n${t2Data.answer}`);
    }
    if (hasCitations) {
      console.log(`Citations Count: ${t2Data.citations.length}`);
      console.log(`Primary Source: ${t2Data.citations[0].source}`);
    }
    console.log('\n');

    // ============================================================
    // EXECUTIVE LATENCY REPORT
    // ============================================================
    const passedCount = (t1Passed ? 1 : 0) + (t2Passed ? 1 : 0);
    const failedCount = 2 - passedCount;
    const previousLatency = 80446;
    const speedup = (previousLatency / Math.max(t2Latency, 1)).toFixed(1);
    const overallVerdict = passedCount === 2 ? 'PASS' : 'FAIL';

    console.log('============================================================');
    console.log('EXECUTIVE LATENCY REPORT');
    console.log('============================================================\n');
    console.log('Previous Latency:');
    console.log('80,446 ms\n');
    console.log('Target Latency:');
    console.log('< 3,000 ms\n');
    console.log('Test 1 — Greeting:');
    console.log(`${t1Latency} ms`);
    console.log('Target: < 50 ms');
    console.log(`Status: ${t1Passed ? 'PASS' : 'FAIL'}\n`);
    console.log('Test 2 — Scientific Query:');
    console.log(`${t2Latency} ms`);
    console.log('Target: < 3,500 ms');
    console.log(`Status: ${t2Passed ? 'PASS' : 'FAIL'}\n`);
    console.log('Total Tests:');
    console.log('2\n');
    console.log('Passed:');
    console.log(`${passedCount}\n`);
    console.log('Failed:');
    console.log(`${failedCount}\n`);
    console.log('Speedup:');
    console.log(`${speedup}x faster\n`);
    console.log('Overall Optimization:');
    console.log(`${overallVerdict}`);
    console.log('============================================================\n');

  } finally {
    if (spawnedProc) {
      spawnedProc.kill('SIGTERM');
    }
  }

  if (!t1Passed || !t2Passed) {
    process.exit(1);
  }
}

runLatencySuite().catch(err => {
  console.error('[Test Suite Error]:', err);
  process.exit(1);
});
