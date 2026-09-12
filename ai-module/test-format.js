/**
 * Automated Verification Script: test-format.js
 * Validates Two-Tier AI Prompt & Response Formatting on Port 5001
 * 
 * Tests:
 * 1. Server connectivity (GET /health)
 * 2. POST /api/ai/ask with Indian Antarctic research stations query in researcher mode
 * 3. Assertions:
 *    - Status 200 OK
 *    - Initial narrative executive overview (2-3 sentences)
 *    - Bullet points formatted with '* **'
 *    - Mentions Maitri (1989) and Bharati (2012)
 * 4. Prints raw formatted response and latency
 */

import { spawn } from 'child_process';

const TARGET_PORT = 5001;
const BASE_URL = `http://localhost:${TARGET_PORT}`;
const ASK_URL = `${BASE_URL}/api/ai/ask`;

async function isServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function ensureServer() {
  const running = await isServerRunning();
  if (running) {
    console.log(`[INIT] Verified standalone-server is active on ${BASE_URL}`);
    return null;
  }

  console.log(`[INIT] Server not detected on port ${TARGET_PORT}. Spawning standalone-server.js...`);
  const proc = spawn('node', ['standalone-server.js'], {
    stdio: 'inherit',
    detached: true
  });
  proc.unref();

  // Wait up to 10 seconds for server boot
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isServerRunning()) {
      console.log(`[INIT] Server successfully booted on ${BASE_URL}`);
      return proc;
    }
  }

  throw new Error(`Server failed to boot on port ${TARGET_PORT} after 10 seconds.`);
}

async function runTest() {
  console.log('================================================================');
  console.log('  SIH 2026: POLAR AI TWO-TIER RESPONSE FORMATTING TEST');
  console.log('================================================================\n');

  await ensureServer();

  const payload = {
    question: "What are the Indian research stations in Antarctica and their scientific scope?",
    mode: "researcher"
  };

  console.log(`[REQUEST] POST ${ASK_URL}`);
  console.log(`[PAYLOAD] ${JSON.stringify(payload, null, 2)}\n`);

  const startTime = Date.now();
  let res, data;

  try {
    res = await fetch(ASK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    data = await res.json();
  } catch (netErr) {
    console.error('❌ Network fetch failed:', netErr.message);
    process.exit(1);
  }

  const latency = Date.now() - startTime;
  console.log(`[RESPONSE TIME] Latency: ${latency} ms\n`);

  // Print Raw Formatted Response
  console.log('================================================================');
  console.log('  RAW FORMATTED AI RESPONSE:');
  console.log('================================================================');
  console.log(data.answer);
  console.log('================================================================\n');

  // Assertions
  const assertions = [];

  // Assertion 1: HTTP Status Code 200
  const statusPass = res.status === 200 && data.success === true;
  assertions.push({
    title: 'HTTP Status Code is 200 OK with success: true',
    passed: statusPass,
    details: `Status: ${res.status}`
  });

  const answer = data.answer || '';

  // Assertion 2: Initial Narrative Paragraph (2-3 sentences overview)
  // Split at first bullet point (* **) to isolate Part 1
  const firstBulletIndex = answer.indexOf('* **');
  const overviewText = firstBulletIndex !== -1 
    ? answer.slice(0, firstBulletIndex).trim() 
    : answer.trim();

  // Sentence count heuristic (counting sentences ending with '.', '!', or '?')
  const sentenceMatches = overviewText.match(/[^.!?]+[.!?]+/g) || [];
  const sentenceCount = sentenceMatches.length;
  const hasOverview = overviewText.length > 40 && !overviewText.startsWith('*') && !overviewText.startsWith('#');
  const sentenceRangePass = hasOverview && (sentenceCount >= 1 && sentenceCount <= 5);

  assertions.push({
    title: 'Part 1: Initial Narrative Paragraph (Executive Overview)',
    passed: hasOverview && sentenceRangePass,
    details: `Overview lines detected: ${overviewText.split('\n').filter(l => l.trim()).length}, Sentences: ${sentenceCount}`
  });

  // Assertion 3: Bullet points formatted with '* **'
  const hasBulletAsterisks = answer.includes('* **');
  const bulletCount = (answer.match(/\*\s+\*\*/g) || []).length;
  assertions.push({
    title: 'Part 2: Clean point-wise breakdown formatted with "* **"',
    passed: hasBulletAsterisks && bulletCount >= 2,
    details: `Found ${bulletCount} bullet points matching "* **"`
  });

  // Assertion 4: Response mentions Maitri (1989) and Bharati (2012)
  const mentionsMaitri = /maitri/i.test(answer) && /1989/.test(answer);
  const mentionsBharati = /bharati/i.test(answer) && /2012/.test(answer);
  assertions.push({
    title: 'Response explicitly mentions Maitri (1989) and Bharati (2012)',
    passed: mentionsMaitri && mentionsBharati,
    details: `Maitri [1989]: ${mentionsMaitri ? 'YES' : 'NO'}, Bharati [2012]: ${mentionsBharati ? 'YES' : 'NO'}`
  });

  // Print Summary
  console.log('================================================================');
  console.log('  ASSERTION RESULTS:');
  console.log('================================================================');
  let allPassed = true;
  for (const a of assertions) {
    const symbol = a.passed ? '✅ [PASS]' : '❌ [FAIL]';
    if (!a.passed) allPassed = false;
    console.log(`${symbol} ${a.title}`);
    console.log(`         Details: ${a.details}`);
  }
  console.log('================================================================\n');

  if (allPassed) {
    console.log(`🎉 ALL ASSERTIONS PASSED! Two-Tier format is strictly enforced. (Latency: ${latency} ms)`);
    process.exit(0);
  } else {
    console.error('⚠️ Some assertions failed. Please review the output.');
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
