const http = require('http');
const { app, startServer } = require('./server');
const { connectToDatabase, closeDatabase, getDb } = require('./Configuration/database');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('TESTING RBAC AUTH & DATASET GOVERNANCE PIPELINE');
  console.log('='.repeat(70));

  await connectToDatabase();

  const testPort = 5599;
  const testServer = app.listen(testPort);

  try {
    const timestamp = Date.now();
    const studentEmail = `student_${timestamp}@polar.test`;
    const researcherEmail = `researcher_${timestamp}@polar.test`;
    const adminEmail = `admin_${timestamp}@polar.test`;
    const password = 'Password@123';

    // TEST 1: Register Student (Defaults to 'student' role)
    console.log('\n--- 1. Testing Student Registration ---');
    const regStudentRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Aryan Student',
      email: studentEmail,
      password
    });
    console.log(`Status: ${regStudentRes.status}, User Role: ${regStudentRes.data?.data?.user?.role}`);
    if (regStudentRes.status !== 201 || regStudentRes.data?.data?.user?.role !== 'student') {
      throw new Error(`Expected role 'student', got: ${regStudentRes.data?.data?.user?.role}`);
    }
    const studentToken = regStudentRes.data?.data?.token;

    // TEST 2: Register Researcher with Institution
    console.log('\n--- 2. Testing Researcher Registration ---');
    const regResearcherRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Dr. Neha Sharma',
      email: researcherEmail,
      password,
      role: 'researcher',
      institution: 'NCPOR Goa Glaciology Division',
      designation: 'Senior Cryosphere Scientist'
    });
    console.log(`Status: ${regResearcherRes.status}, User Role: ${regResearcherRes.data?.data?.user?.role}`);
    if (regResearcherRes.status !== 201 || regResearcherRes.data?.data?.user?.role !== 'researcher') {
      throw new Error(`Expected role 'researcher', got: ${regResearcherRes.data?.data?.user?.role}`);
    }
    const researcherToken = regResearcherRes.data?.data?.token;

    // TEST 3: Register Admin
    console.log('\n--- 3. Testing Admin Registration ---');
    const regAdminRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Polar Admin Director',
      email: adminEmail,
      password,
      role: 'admin',
      institution: 'Ministry of Earth Sciences'
    });
    console.log(`Status: ${regAdminRes.status}, User Role: ${regAdminRes.data?.data?.user?.role}`);
    if (regAdminRes.status !== 201 || regAdminRes.data?.data?.user?.role !== 'admin') {
      throw new Error(`Expected role 'admin', got: ${regAdminRes.data?.data?.user?.role}`);
    }
    const adminToken = regAdminRes.data?.data?.token;

    // TEST 4: Profile Check (GET /api/auth/me)
    console.log('\n--- 4. Testing GET /api/auth/me ---');
    const meRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${researcherToken}` }
    });
    console.log(`Status: ${meRes.status}, Role: ${meRes.data?.data?.role}, Name: ${meRes.data?.data?.name}`);
    if (meRes.status !== 200 || meRes.data?.data?.role !== 'researcher') {
      throw new Error(`Auth me failed or incorrect role`);
    }

    // TEST 5: Download without authentication -> Must return 401
    console.log('\n--- 5. Testing Download Route Protection (Unauthenticated) ---');
    const unauthDownloadRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/datasets/download/sub-weather-aws',
      method: 'GET'
    });
    console.log(`Status: ${unauthDownloadRes.status} (Expected 401)`);
    if (unauthDownloadRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated download, got ${unauthDownloadRes.status}`);
    }

    // TEST 6: Download with Authentication (Student) -> Returns 200 and resolved download URL
    console.log('\n--- 6. Testing Download Route (Authenticated Student) ---');
    const studentDownloadRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/datasets/download/sub-weather-aws',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    console.log(`Status: ${studentDownloadRes.status}, Resolved URL: ${studentDownloadRes.data?.data?.download_url}`);
    if (studentDownloadRes.status !== 200 || !studentDownloadRes.data?.data?.download_url) {
      throw new Error('Authenticated download failed');
    }

    // Verify Telemetry was logged in MongoDB
    const db = getDb();
    const telemetry = await db.collection('download_telemetry').findOne({ user_email: studentEmail });
    console.log(`Telemetry logged in MongoDB:`, telemetry ? `YES (dataset: ${telemetry.dataset_id})` : 'NO');
    if (!telemetry) throw new Error('Telemetry was not recorded in MongoDB');

    // TEST 7: Attempt Upload as Student -> Must return 403 Forbidden
    console.log('\n--- 7. Testing Upload Restriction for Student Role ---');
    const studentUploadRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/submissions/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      }
    }, {
      title: 'Unauthorized Student Dataset'
    });
    console.log(`Status: ${studentUploadRes.status} (Expected 403)`);
    if (studentUploadRes.status !== 403) {
      throw new Error(`Expected 403 for student upload, got ${studentUploadRes.status}`);
    }

    // TEST 8: Upload Dataset as Researcher -> Must succeed (status: pending)
    console.log('\n--- 8. Testing Dataset Upload by Researcher ---');
    const researcherUploadRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/submissions/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${researcherToken}`
      }
    }, {
      title: `Schirmacher Oasis Glacial Dynamics ${timestamp}`,
      category: '02_scientific',
      file_format: 'ZIP',
      file_url: 'https://huggingface.co/datasets/aryansankaliya/sih26063-polar-data/resolve/main/02_scientific/cryosphere/cryosphere_bundle.zip',
      description: 'High-resolution radar soundings of ice shelf thickness and basal melt rates in central Dronning Maud Land.'
    });
    console.log(`Status: ${researcherUploadRes.status}, Submission Status: ${researcherUploadRes.data?.data?.status}`);
    if (researcherUploadRes.status !== 201 || researcherUploadRes.data?.data?.status !== 'pending') {
      throw new Error(`Upload submission failed: ${JSON.stringify(researcherUploadRes.data)}`);
    }
    const submissionId = researcherUploadRes.data?.data?.id || researcherUploadRes.data?.data?.submission_id;

    // TEST 9: Admin Fetch Submissions (GET /api/admin/submissions)
    console.log('\n--- 9. Testing Admin Submissions Review Console ---');
    const adminFetchRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: '/api/admin/submissions?status=pending',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`Status: ${adminFetchRes.status}, Pending Submissions Count: ${adminFetchRes.data?.data?.total}`);
    if (adminFetchRes.status !== 200 || !Array.isArray(adminFetchRes.data?.data?.submissions)) {
      throw new Error('Admin fetch submissions failed');
    }

    // TEST 10: Admin Decision -> Approve & Publish
    console.log('\n--- 10. Testing Admin Decision: Approve & Publish ---');
    const approveRes = await makeRequest({
      hostname: 'localhost',
      port: testPort,
      path: `/api/admin/submissions/${submissionId}/decision`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      decision: 'approve',
      remarks: 'Verified by NCPOR Cryosphere Science Review Board. Published to national catalog.'
    });
    console.log(`Status: ${approveRes.status}, Result: ${approveRes.data?.message}`);
    if (approveRes.status !== 200 || approveRes.data?.data?.decision !== 'approved') {
      throw new Error(`Approve decision failed: ${JSON.stringify(approveRes.data)}`);
    }

    // Verify dataset is now present in live 'datasets' collection
    const publishedDataset = await db.collection('datasets').findOne({
      title: `Schirmacher Oasis Glacial Dynamics ${timestamp}`
    });
    console.log(`Live Dataset created in 'datasets':`, publishedDataset ? `YES (ID: ${publishedDataset.dataset_id})` : 'NO');
    if (!publishedDataset) {
      throw new Error('Approved dataset was not found in primary datasets collection');
    }

    console.log('\n' + '='.repeat(70));
    console.log('ALL 10 BACKEND RBAC & GOVERNANCE TESTS PASSED WITH 100% SUCCESS!');
    console.log('='.repeat(70));

  } finally {
    testServer.close();
    await closeDatabase();
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
