const http = require('http');
const { app } = require('../server');
const { connectToDatabase, closeDatabase } = require('../Configuration/database');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        let isJson = false;
        try {
          parsed = JSON.parse(body);
          isJson = true;
        } catch (e) {
          isJson = false;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
          raw: body,
          isJson
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runVerification() {
  console.log('='.repeat(70));
  console.log('VERIFYING AUTH HARDENING & JSON RESPONSE GUARANTEE');
  console.log('='.repeat(70));

  await connectToDatabase();

  const testPort = 5699;
  const testServer = app.listen(testPort);

  try {
    // 1. Missing credentials validation
    console.log('\n[TEST 1] Missing email and password validation...');
    const emptyLoginRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    console.log(`Status: ${emptyLoginRes.status}, isJson: ${emptyLoginRes.isJson}`);
    console.log('Body:', emptyLoginRes.data);
    if (emptyLoginRes.status !== 400 || !emptyLoginRes.isJson || emptyLoginRes.data.success !== false) {
      throw new Error('Test 1 failed: Expected HTTP 400 JSON response');
    }
    console.log('✅ Test 1 PASSED: Strict 400 JSON on missing credentials');

    // 2. Missing password validation
    console.log('\n[TEST 2] Missing password validation...');
    const missingPassRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'student@polar.test' });
    console.log(`Status: ${missingPassRes.status}, isJson: ${missingPassRes.isJson}`);
    console.log('Body:', missingPassRes.data);
    if (missingPassRes.status !== 400 || !missingPassRes.isJson || missingPassRes.data.success !== false) {
      throw new Error('Test 2 failed: Expected HTTP 400 JSON response');
    }
    console.log('✅ Test 2 PASSED: Strict 400 JSON on missing password');

    // 3. Invalid credentials check
    console.log('\n[TEST 3] Invalid credentials check...');
    const invalidLoginRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'nonexistent_user_999@polar.test', password: 'WrongPassword123' });
    console.log(`Status: ${invalidLoginRes.status}, isJson: ${invalidLoginRes.isJson}`);
    console.log('Body:', invalidLoginRes.data);
    if (invalidLoginRes.status !== 401 || !invalidLoginRes.isJson || invalidLoginRes.data.success !== false) {
      throw new Error('Test 3 failed: Expected HTTP 401 JSON response');
    }
    console.log('✅ Test 3 PASSED: Strict 401 JSON on invalid credentials');

    // 4. Register and verify login flow + structured JSON payload
    console.log('\n[TEST 4] Register & Login structured JSON response verification...');
    const timestamp = Date.now();
    const testEmail = `harden_test_${timestamp}@polar.test`;
    const testPass = 'Password@123';
    const testName = 'Dr. Polar Scientist';

    const regRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: testName,
      email: testEmail,
      password: testPass,
      role: 'researcher',
      institution: 'NCPOR Goa'
    });
    console.log(`Registration Status: ${regRes.status}, isJson: ${regRes.isJson}`);
    if (regRes.status !== 201 || !regRes.isJson || !regRes.data.success || !regRes.data.token) {
      throw new Error('Test 4 Registration failed');
    }

    const loginRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: testEmail,
      password: testPass
    });
    console.log(`Login Status: ${loginRes.status}, isJson: ${loginRes.isJson}`);
    console.log('Login Response Body:', JSON.stringify(loginRes.data, null, 2));

    if (loginRes.status !== 200 || !loginRes.isJson) {
      throw new Error('Test 4 Login failed: Expected HTTP 200 with JSON');
    }
    if (!loginRes.data.token || typeof loginRes.data.token !== 'string') {
      throw new Error('Test 4 failed: Missing top-level token');
    }
    if (!loginRes.data.user || !loginRes.data.user.id || !loginRes.data.user.email) {
      throw new Error('Test 4 failed: Missing structured user object');
    }
    console.log('✅ Test 4 PASSED: Successful login returned structured token and user payload');

    // 5. CORS preflight OPTIONS request
    console.log('\n[TEST 5] CORS preflight OPTIONS request from Vercel domain...');
    const optionsRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/auth/login',
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://moes-polar-portal.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    console.log(`OPTIONS Status: ${optionsRes.status}`);
    console.log('Allow-Origin Header:', optionsRes.headers['access-control-allow-origin']);
    if (optionsRes.status > 204 || !optionsRes.headers['access-control-allow-origin']) {
      throw new Error('Test 5 failed: CORS preflight did not return allowed origin header');
    }
    console.log('✅ Test 5 PASSED: CORS preflight cleanly resolved with allow-origin headers');

    // 6. Non-existent API route -> Must return JSON 404, never HTML or empty body
    console.log('\n[TEST 6] Non-existent API route 404 JSON guarantee...');
    const notFoundRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/non_existent_auth_path_test',
      method: 'GET'
    });
    console.log(`Status: ${notFoundRes.status}, isJson: ${notFoundRes.isJson}`);
    console.log('Body:', notFoundRes.data);
    if (notFoundRes.status !== 404 || !notFoundRes.isJson || notFoundRes.data.success !== false) {
      throw new Error('Test 6 failed: Expected HTTP 404 JSON response for unknown API path');
    }
    console.log('✅ Test 6 PASSED: Unknown API route returned structured JSON 404');

    // 7. Root status endpoint
    console.log('\n[TEST 7] Root / status endpoint...');
    const rootRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/',
      method: 'GET'
    });
    console.log(`Status: ${rootRes.status}, isJson: ${rootRes.isJson}`);
    console.log('Body:', rootRes.data);
    if (rootRes.status !== 200 || !rootRes.isJson || rootRes.data.status !== 'online') {
      throw new Error('Test 7 failed: Root ping did not return online status');
    }
    console.log('✅ Test 7 PASSED: Root / ping returned valid status JSON');

    console.log('\n' + '='.repeat(70));
    console.log('🎉 ALL AUTH HARDENING TESTS PASSED SUCCESSFULLY!');
    console.log('='.repeat(70));
  } finally {
    testServer.close();
    await closeDatabase();
  }
}

runVerification().catch(err => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
