/**
 * Comprehensive Automated Test Runner for SIH 2026 Polar AI Microservice
 * Validates:
 * 1. Healthcheck (GET /health)
 * 2. Student Persona Outreach (POST /api/ai/ask)
 * 3. Researcher Persona & Data Grounding (POST /api/ai/ask)
 * 4. Error Boundary & Resilience (POST /api/ai/ask without question)
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const BASE_URL = process.env.TARGET_URL || 'http://localhost:5001';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tracking metrics
const report = {
  totalExecuted: 0,
  totalPassed: 0,
  totalFailed: 0,
  results: {
    test1: 'FAIL',
    test2: 'FAIL',
    test3: 'FAIL',
    test4: 'FAIL'
  },
  latencies: {
    test1: 0,
    test2: 0,
    test3: 0,
    test4: 0
  },
  metricsGrounding: 'NOT VERIFIED',
  serverStatus: 'NOT RUNNING',
  stabilityAfterError: 'FAIL',
  rawAnswers: {
    student: '',
    researcher: ''
  }
};

/**
 * Ensures the server is active on Port 5001 before running tests.
 */
async function ensureServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      console.log(`[INIT] Verified standalone-server is already active on ${BASE_URL}`);
      report.serverStatus = 'RUNNING';
      return null;
    }
  } catch (err) {
    // Server not running yet; proceed to launch standalone-server.js
  }

  console.log(`[INIT] Server not detected on ${BASE_URL}. Launching standalone-server.js...`);
  const serverProcess = spawn('node', ['standalone-server.js'], {
    cwd: __dirname,
    stdio: 'ignore',
    detached: true
  });
  serverProcess.unref();

  // Polling until available (up to 10 seconds)
  const startTime = Date.now();
  while (Date.now() - startTime < 10000) {
    try {
      const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(1000) });
      if (res.ok) {
        console.log(`[INIT] standalone-server.js successfully booted and listening on ${BASE_URL}`);
        report.serverStatus = 'RUNNING';
        return serverProcess;
      }
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  throw new Error(`Failed to connect to standalone-server on ${BASE_URL} after 10s.`);
}

/**
 * Main Test Execution Workflow
 */
async function runValidationSuite() {
  console.log('============================================================');
  console.log('STARTING AUTOMATED AI MICROSERVICE VALIDATION SUITE');
  console.log(`Target: ${BASE_URL}`);
  console.log('============================================================\n');

  await ensureServerRunning();

  // --------------------------------------------------------------------------
  // TEST 1 — HEALTHCHECK VALIDATION
  // --------------------------------------------------------------------------
  console.log('------------------------------------------------------------');
  console.log('TEST 1 — HEALTHCHECK VALIDATION');
  console.log('Endpoint: GET http://localhost:5001/health');
  console.log('------------------------------------------------------------');
  report.totalExecuted++;

  const t1Start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const duration = Date.now() - t1Start;
    report.latencies.test1 = duration;

    console.log(`Status Received: ${res.status}`);
    console.log(`Response Time: ${duration} ms`);

    if (res.status !== 200) {
      throw new Error(`Expected HTTP 200 OK, received ${res.status}`);
    }

    const data = await res.json();
    console.log(`Payload:`, JSON.stringify(data, null, 2));

    if (!data || data.status !== 'healthy') {
      throw new Error(`Expected { status: 'healthy' } in response payload`);
    }

    if (Number(data.port) !== 5001) {
      throw new Error(`Expected port 5001 in health payload, received ${data.port}`);
    }

    report.results.test1 = 'PASS';
    report.totalPassed++;
    report.serverStatus = 'RUNNING';
    console.log('[PASS] Test 1: Healthcheck endpoint successfully verified.\n');
  } catch (err) {
    report.results.test1 = 'FAIL';
    report.totalFailed++;
    console.error(`[FAIL] Test 1 Assertion Failed: ${err.message}\n`);
  }

  // --------------------------------------------------------------------------
  // TEST 2 — STUDENT PERSONA OUTREACH TEST
  // --------------------------------------------------------------------------
  console.log('------------------------------------------------------------');
  console.log('TEST 2 — STUDENT PERSONA OUTREACH TEST');
  console.log('Endpoint: POST http://localhost:5001/api/ai/ask');
  console.log('Payload Mode: student');
  console.log('------------------------------------------------------------');
  report.totalExecuted++;

  const studentPayload = {
    question: "Why does Antarctic seawater not freeze easily despite sub-zero temperatures?",
    mode: "student"
  };

  const t2Start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentPayload)
    });
    const duration = Date.now() - t2Start;
    report.latencies.test2 = duration;

    console.log(`Status Received: ${res.status}`);
    console.log(`Response Time: ${duration} ms`);

    if (res.status !== 200) {
      const errText = await res.text();
      throw new Error(`Expected HTTP 200 OK, received ${res.status}. Body: ${errText}`);
    }

    const data = await res.json();

    // 1. Success validation
    if (data.success !== true) {
      throw new Error(`Expected success: true, received: ${data.success}`);
    }

    // 2. Answer validation
    if (!data.answer || typeof data.answer !== 'string' || data.answer.trim().length === 0) {
      throw new Error('Missing or empty answer field in response.');
    }
    report.rawAnswers.student = data.answer;

    // 3. Student Persona Tone & Concept Validation
    const lowerAnswer = data.answer.toLowerCase();
    const hasSaltConcept = lowerAnswer.includes('salt') || lowerAnswer.includes('salin');
    const hasFreezingConcept = lowerAnswer.includes('freez') || lowerAnswer.includes('crystal') || lowerAnswer.includes('lattice') || lowerAnswer.includes('bond') || lowerAnswer.includes('barrier');

    if (!hasSaltConcept || !hasFreezingConcept) {
      throw new Error(`Student persona answer does not explain how salt/salinity disrupts freezing or crystal formation.`);
    }

    // 4. Citation Validation (citations OR verifiedSource)
    const citationData = data.citations || data.verifiedSource;
    if (!citationData) {
      throw new Error("Expected 'citations' or 'verifiedSource' in response payload.");
    }

    const citationString = JSON.stringify(citationData);
    if (!citationString.includes('NOAA') && !citationString.includes('Polar') && !citationString.includes('Dome Fuji')) {
      throw new Error("Citation does not reference expected NOAA / Polar / Ice Core archives.");
    }

    report.results.test2 = 'PASS';
    report.totalPassed++;
    console.log('[PASS] Test 2: Student persona outreach and citation successfully verified.\n');
  } catch (err) {
    report.results.test2 = 'FAIL';
    report.totalFailed++;
    console.error(`[FAIL] Test 2 Assertion Failed: ${err.message}\n`);
  }

  // Print Test 2 Raw Answer
  console.log('============================================================');
  console.log('TEST 2 RAW ANSWER — STUDENT PERSONA');
  console.log('============================================================');
  console.log(report.rawAnswers.student || '<No answer generated>');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 3 — RESEARCHER PERSONA & DATA GROUNDING TEST
  // --------------------------------------------------------------------------
  console.log('------------------------------------------------------------');
  console.log('TEST 3 — RESEARCHER PERSONA & DATA GROUNDING TEST');
  console.log('Endpoint: POST http://localhost:5001/api/ai/ask');
  console.log('Payload Mode: researcher');
  console.log('------------------------------------------------------------');
  report.totalExecuted++;

  const researcherPayload = {
    question: "Explain the thermodynamic impact of 34.203 PSU salinity on Southern Ocean water mass stratification.",
    mode: "researcher"
  };

  const t3Start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(researcherPayload)
    });
    const duration = Date.now() - t3Start;
    report.latencies.test3 = duration;

    console.log(`Status Received: ${res.status}`);
    console.log(`Response Time: ${duration} ms`);

    if (res.status !== 200) {
      const errText = await res.text();
      throw new Error(`Expected HTTP 200 OK, received ${res.status}. Body: ${errText}`);
    }

    const data = await res.json();

    // 1. Success validation
    if (data.success !== true) {
      throw new Error(`Expected success: true, received: ${data.success}`);
    }

    // 2. Answer validation
    if (!data.answer || typeof data.answer !== 'string' || data.answer.trim().length === 0) {
      throw new Error('Missing or empty answer field in response.');
    }
    report.rawAnswers.researcher = data.answer;

    // 3. Researcher Persona Vocabulary Validation
    const answer = data.answer;
    const lowerAnswer = answer.toLowerCase();

    const hasThermodynamics = lowerAnswer.includes('thermodynamic') || lowerAnswer.includes('freezing point') || lowerAnswer.includes('density') || lowerAnswer.includes('haline') || lowerAnswer.includes('brine');
    const hasStratification = lowerAnswer.includes('stratification') || lowerAnswer.includes('water mass') || lowerAnswer.includes('pycnocline') || lowerAnswer.includes('bottom water') || lowerAnswer.includes('aabw');

    if (!hasThermodynamics || !hasStratification) {
      throw new Error('Researcher persona lacks expected thermodynamic or oceanographic stratification depth.');
    }

    // 4. Exact Grounding Validation: -1.571°C and 34.203 PSU
    // Check answer or citations for exact ground-truth values
    const citationsStr = JSON.stringify(data.citations || data.verifiedSource || '');
    const combinedContent = `${answer} ${citationsStr}`;

    const hasTempGrounding = combinedContent.includes('-1.571°C') || combinedContent.includes('-1.571 °C') || combinedContent.includes('-1.571');
    const hasSalinityGrounding = combinedContent.includes('34.203 PSU') || combinedContent.includes('34.203');

    if (!hasTempGrounding) {
      throw new Error(`Missing exact grounded temperature metric: -1.571°C`);
    }
    if (!hasSalinityGrounding) {
      throw new Error(`Missing exact grounded salinity metric: 34.203 PSU`);
    }

    report.metricsGrounding = 'VERIFIED';
    report.results.test3 = 'PASS';
    report.totalPassed++;
    console.log('[PASS] Test 3: Researcher persona and exact numerical grounding successfully verified.\n');
  } catch (err) {
    report.results.test3 = 'FAIL';
    report.totalFailed++;
    console.error(`[FAIL] Test 3 Assertion Failed: ${err.message}\n`);
  }

  // Print Test 3 Raw Answer
  console.log('============================================================');
  console.log('TEST 3 RAW ANSWER — RESEARCHER PERSONA');
  console.log('============================================================');
  console.log(report.rawAnswers.researcher || '<No answer generated>');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 4 — ERROR BOUNDARY & RESILIENCE TEST
  // --------------------------------------------------------------------------
  console.log('------------------------------------------------------------');
  console.log('TEST 4 — ERROR BOUNDARY & RESILIENCE TEST');
  console.log('Endpoint: POST http://localhost:5001/api/ai/ask');
  console.log('Payload: { "mode": "student" } (Missing question)');
  console.log('------------------------------------------------------------');
  report.totalExecuted++;

  const t4Start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: "student" })
    });
    const duration = Date.now() - t4Start;
    report.latencies.test4 = duration;

    console.log(`Status Received: ${res.status}`);
    console.log(`Response Time: ${duration} ms`);

    if (res.status !== 400) {
      throw new Error(`Expected HTTP 400 Bad Request, received ${res.status}`);
    }

    const data = await res.json();
    console.log(`Payload:`, JSON.stringify(data, null, 2));

    const errorMessage = data.error || data.message || '';
    const lowerMsg = errorMessage.toLowerCase();

    if (!lowerMsg.includes('question') || (!lowerMsg.includes('required') && !lowerMsg.includes('missing'))) {
      throw new Error(`Error message must explicitly indicate question is required. Received: "${errorMessage}"`);
    }

    // Resilience check: Verify server is still alive and responsive after error
    const pingRes = await fetch(`${BASE_URL}/health`);
    if (pingRes.status === 200) {
      report.stabilityAfterError = 'PASS';
    } else {
      throw new Error(`Server unstable after invalid request; healthcheck returned ${pingRes.status}`);
    }

    report.results.test4 = 'PASS';
    report.totalPassed++;
    console.log('[PASS] Test 4: Error boundary and resilience check successfully verified.\n');
  } catch (err) {
    report.results.test4 = 'FAIL';
    report.totalFailed++;
    console.error(`[FAIL] Test 4 Assertion Failed: ${err.message}\n`);
  }

  // --------------------------------------------------------------------------
  // EXECUTIVE VERIFICATION REPORT
  // --------------------------------------------------------------------------
  const allPassed = report.totalPassed === report.totalExecuted && report.totalExecuted === 4;

  console.log('============================================================');
  console.log('EXECUTIVE VERIFICATION REPORT');
  console.log('============================================================');
  console.log(`Total Tests Executed: ${report.totalExecuted}`);
  console.log(`Total Passed: ${report.totalPassed}`);
  console.log(`Total Failed: ${report.totalFailed}\n`);

  console.log('Test Results:');
  console.log(`1. Healthcheck: ${report.results.test1}`);
  console.log(`2. Student Persona: ${report.results.test2}`);
  console.log(`3. Researcher Grounding: ${report.results.test3}`);
  console.log(`4. Error Boundary & Resilience: ${report.results.test4}\n`);

  console.log('API Latency:');
  console.log(`- Test 1: ${report.latencies.test1} ms`);
  console.log(`- Test 2: ${report.latencies.test2} ms`);
  console.log(`- Test 3: ${report.latencies.test3} ms`);
  console.log(`- Test 4: ${report.latencies.test4} ms\n`);

  console.log('Grounded Oceanographic Metrics:');
  console.log('- Expected Freezing Point: -1.571°C');
  console.log('- Expected Salinity: 34.203 PSU');
  console.log(`- Verification Status: ${report.metricsGrounding}\n`);

  console.log('Server Status:');
  console.log(`- Port 5001: ${report.serverStatus}`);
  console.log(`- Server Stability After Invalid Request: ${report.stabilityAfterError}\n`);

  console.log('Overall Verification:');
  console.log(allPassed ? 'PASS' : 'FAIL');
  console.log('============================================================\n');

  if (!allPassed) {
    process.exitCode = 1;
  }
}

runValidationSuite().catch(err => {
  console.error('[CRITICAL RUNNER ERROR]:', err);
  process.exit(1);
});
