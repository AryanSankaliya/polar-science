/**
 * Verification Test: test-point-view.js
 * Validates Point-View Response Formatting Rule on Port 5001
 * 
 * Verifies:
 * 1. HTTP Status 200 and successful API response
 * 2. No obvious comma-separated research lists in response
 * 3. Proper Markdown bullet structure (* **)
 * 4. Prints test name, HTTP status, PASS/FAIL, assertion results, and complete formatted AI response
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

  const queryText = "What are the primary research areas conducted at Maitri and surrounding blue ice areas?";
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

  // Assertion 1: No comma-joined research lists
  // Detects comma-separated scientific lists like "meteorology, low-temperature geomorphology, and"
  // or inline lists of 3+ disciplines separated by commas.
  const commaSeparatedListRegex = /(?:meteorology|geology|glaciology|geomorphology|oceanography|biology|physics|chemistry|limnology|seismology)[^.\n]*,\s*(?:meteorology|geology|glaciology|geomorphology|oceanography|biology|physics|chemistry|limnology|seismology)[^.\n]*,\s*(?:and\s+)?[a-z]/i;
  const prohibitedExamplePattern = /meteorology,\s*low-temperature\s*geomorphology,\s*and/i;
  
  const hasCommaList = commaSeparatedListRegex.test(answer) || prohibitedExamplePattern.test(answer);
  const commaCheckPass = !hasCommaList;

  // Assertion 2: Bullet Point Formatting (** or * **)
  const bulletCheckPass = answer.includes('* **') || answer.split('\n').filter(l => l.trim().startsWith('** ')).length >= 2;

  // Assertion 3: API Response Check (HTTP 200 & valid data.answer)
  const apiResponseCheckPass = res.status === 200 && data?.success === true && typeof answer === 'string' && answer.length > 50;

  const allPassed = commaCheckPass && bulletCheckPass && apiResponseCheckPass;

  // Formatted Output matching Section 6
  console.log('================================================================================');
  console.log('POINT-VIEW FORMAT TEST');
  console.log('================================================================================\n');

  console.log('Query:');
  console.log(queryText);
  console.log('\nMode:');
  console.log(queryMode);
  console.log(`\nHTTP Status: ${res.status}\n`);

  console.log(`Comma-Separated List Check: ${commaCheckPass ? 'PASS' : 'FAIL'}`);
  console.log(`Bullet Point Check: ${bulletCheckPass ? 'PASS' : 'FAIL'}`);
  console.log(`API Response Check: ${apiResponseCheckPass ? 'PASS' : 'FAIL'}\n`);

  console.log('--------------------------------------------------------------------------------');
  console.log('FORMATTED AI RESPONSE');
  console.log('--------------------------------------------------------------------------------\n');
  console.log(answer);
  console.log('\n================================================================================');
  console.log('FINAL RESULT');
  console.log('================================================================================\n');
  console.log(allPassed ? 'PASS' : 'FAIL');

  process.exit(allPassed ? 0 : 1);
}

runTest().catch(err => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
