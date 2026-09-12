/**
 * Verification Script: test-station-points.js
 * Validates Multi-Tier Station Hierarchy and Point-View Bullet Formatting on Port 5001
 * 
 * Endpoint: POST http://localhost:5001/api/ai/ask
 * Payload:
 * {
 *   "question": "Give detailed information on Indian Antarctic stations and their scientific research focus.",
 *   "mode": "researcher"
 * }
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

  const queryText = "Give detailed information on Indian Antarctic stations and their scientific research focus.";
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

  // TEST 1 — API SUCCESS
  const apiPass = res.status === 200 && data?.success === true && typeof answer === 'string' && answer.trim().length > 40;

  // TEST 2 — EXECUTIVE OVERVIEW
  // Confirm meaningful narrative text appears before the first main station heading
  const firstMainPointIndex = answer.indexOf('* **');
  const overviewText = firstMainPointIndex !== -1 ? answer.slice(0, firstMainPointIndex).trim() : '';
  const overviewPass = overviewText.length >= 30 && !overviewText.startsWith('*') && !overviewText.startsWith('**');

  // TEST 3 — MAIN STATION HEADINGS
  // Check for * **Maitri Station: and * **Bharati Station: (or * **Maitri: and * **Bharati:)
  const maitriHeadingPass = /\*\s+\*\*Maitri(?:\s+Station)?:\*\*/i.test(answer) || /\*\s+\*\*Maitri/i.test(answer);
  const bharatiHeadingPass = /\*\s+\*\*Bharati(?:\s+Station)?:\*\*/i.test(answer) || /\*\s+\*\*Bharati/i.test(answer);

  // TEST 4 — SCIENTIFIC SUB-BULLETS
  // Verify multiple lines beginning with '** ' (at least 2 separate lines)
  const lines = answer.split('\n');
  const subBulletLines = lines.filter(line => line.trim().startsWith('** '));
  const subBulletPass = subBulletLines.length >= 2;

  // TEST 5 — NO COMMA-JOINED RESEARCH LIST
  // Target multi-item research lists specifically (do not reject legitimate commas inside a single description)
  const commaSeparatedDisciplinesRegex = /(?:earth sciences|meteorology|glaciology|geology|oceanography|biology|physics|chemistry|limnology|seismology)[^.\n]*,\s*(?:earth sciences|meteorology|glaciology|geology|oceanography|biology|physics|chemistry|limnology|seismology)[^.\n]*,\s*(?:and\s+)?[a-z]/i;
  const prohibitedPattern = /earth sciences,\s*meteorology,\s*low-temperature\s*geomorphology,\s*and/i;
  const prohibitedPattern2 = /meteorology,\s*geology,\s*glaciology,\s*and/i;

  const hasCommaList = commaSeparatedDisciplinesRegex.test(answer) || prohibitedPattern.test(answer) || prohibitedPattern2.test(answer);
  const commaListPass = !hasCommaList;

  const allPassed = apiPass && overviewPass && maitriHeadingPass && bharatiHeadingPass && subBulletPass && commaListPass;

  // Print output matching Section 6
  console.log('================================================================================');
  console.log('STATION POINT-VIEW FORMAT TEST');
  console.log('================================================================================\n');

  console.log('Query:');
  console.log(queryText);
  console.log('\nMode:');
  console.log(queryMode);
  console.log(`\nHTTP Status: ${res.status}\n`);

  console.log(`API Response Check: ${apiPass ? 'PASS' : 'FAIL'}`);
  console.log(`Executive Overview Check: ${overviewPass ? 'PASS' : 'FAIL'}`);
  console.log(`Maitri Station Heading: ${maitriHeadingPass ? 'PASS' : 'FAIL'}`);
  console.log(`Bharati Station Heading: ${bharatiHeadingPass ? 'PASS' : 'FAIL'}`);
  console.log(`Sub-Bullet Format Check: ${subBulletPass ? 'PASS' : 'FAIL'}`);
  console.log(`Comma-Separated Research List Check: ${commaListPass ? 'PASS' : 'FAIL'}\n`);

  console.log('--------------------------------------------------------------------------------');
  console.log('VERIFIED AI RESPONSE');
  console.log('--------------------------------------------------------------------------------\n');
  console.log(answer);
  console.log('\n--------------------------------------------------------------------------------');
  console.log('FINAL RESULT');
  console.log('================================================================================\n');
  console.log(allPassed ? 'PASS' : 'FAIL');

  process.exit(allPassed ? 0 : 1);
}

runTest().catch(err => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
