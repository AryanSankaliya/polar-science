/**
 * Verification Test: test-bullets.js
 * Validates Strict '** ' Bullet Point-View Formatting on Port 5001
 * 
 * Target Endpoint: POST http://localhost:5001/api/ai/ask
 * 
 * Verifies:
 * 1. HTTP Status 200 and valid response structure
 * 2. Multiple lines beginning with '** ' (at least two)
 * 3. No comma-separated multi-item activity lists
 * 4. Prints test report with actual AI response directly from live server
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
    return null;
  }

  const proc = spawn('node', ['standalone-server.js'], {
    stdio: 'inherit',
    detached: true
  });
  proc.unref();

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isServerRunning()) {
      return proc;
    }
  }

  throw new Error(`Server failed to boot on port ${TARGET_PORT} after 10 seconds.`);
}

async function runTest() {
  await ensureServer();

  const queryText = "What are the research activities conducted at Maitri station?";
  const queryMode = "researcher";

  const payload = {
    question: queryText,
    mode: queryMode
  };

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

  const answer = data?.answer || '';

  // Assertion 1: Successful API Response (Status 200 & valid answer)
  const apiResponseCheckPass = res.status === 200 && data?.success === true && typeof answer === 'string' && answer.trim().length > 30;

  // Assertion 2: Required Bullet Format (Multiple lines beginning with '** ')
  const lines = answer.split('\n');
  const bulletLines = lines.filter(line => line.trim().startsWith('** '));
  const bulletCheckPass = bulletLines.length >= 2;

  // Assertion 3: No Comma-Separated Activity List
  // Specifically catches inline run-on lists of disciplines/activities like:
  // "meteorology, geology, glaciology, and environmental studies"
  const commaSeparatedDisciplinesRegex = /(?:meteorology|geology|glaciology|geomorphology|oceanography|biology|physics|chemistry|limnology|seismology)[^.\n]*,\s*(?:meteorology|geology|glaciology|geomorphology|oceanography|biology|physics|chemistry|limnology|seismology)[^.\n]*,\s*(?:and\s+)?[a-z]/i;
  const prohibitedPattern = /meteorology,\s*geology,\s*glaciology,\s*and/i;
  const prohibitedPattern2 = /earth sciences,\s*meteorology,\s*low-temperature/i;
  
  const hasCommaSeparatedList = commaSeparatedDisciplinesRegex.test(answer) || prohibitedPattern.test(answer) || prohibitedPattern2.test(answer);
  const commaCheckPass = !hasCommaSeparatedList;

  const allPassed = apiResponseCheckPass && bulletCheckPass && commaCheckPass;

  // Output format strictly matching Section 6
  console.log('================================================================================');
  console.log('POINT-VIEW BULLET FORMAT TEST');
  console.log('================================================================================\n');

  console.log('Query:');
  console.log(queryText);
  console.log('\nMode:');
  console.log(queryMode);
  console.log(`\nHTTP Status: ${res.status}\n`);

  console.log(`API Response Check: ${apiResponseCheckPass ? 'PASS' : 'FAIL'}`);
  console.log(`Multiple '** ' Bullet Lines: ${bulletCheckPass ? 'PASS' : 'FAIL'}`);
  console.log(`Comma-Separated Activity List Check: ${commaCheckPass ? 'PASS' : 'FAIL'}\n`);

  console.log('--------------------------------------------------------------------------------');
  console.log('ACTUAL AI RESPONSE');
  console.log('--------------------------------------------------------------------------------\n');
  console.log(answer);
  console.log('\n--------------------------------------------------------------------------------');
  console.log('FINAL RESULT');
  console.log('--------------------------------------------------------------------------------\n');
  console.log(allPassed ? 'PASS' : 'FAIL');

  process.exit(allPassed ? 0 : 1);
}

runTest().catch(err => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
