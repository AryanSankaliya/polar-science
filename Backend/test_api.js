/**
 * Automated Verification Test for Polar Science Hub Express API Endpoints
 * Tests:
 * 1. GET http://localhost:5000/api/v1/scientific/ocean
 * 2. GET http://localhost:5000/api/v1/scientific/ice-core
 */

async function testEndpoint(name, url) {
  console.log('\n' + '='.repeat(70));
  console.log(`TESTING ENDPOINT: ${name}`);
  console.log(`URL: ${url}`);
  console.log('='.repeat(70));

  try {
    const response = await fetch(url);
    const statusCode = response.status;
    console.log(`HTTP Status Code: ${statusCode} ${response.statusText}`);

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Request failed with status ${statusCode}:`, errText);
      return false;
    }

    const json = await response.json();
    console.log(`Response Success Field: ${json.success}`);
    console.log(`Total Records Returned: ${json.count}`);

    if (json.station) {
      console.log(`Station: ${json.station}`);
    }

    if (json.stats) {
      console.log('\nCALCULATED STATISTICS OBJECT (Backend Pre-Computed):');
      console.log(JSON.stringify(json.stats, null, 2));
    }

    if (Array.isArray(json.data) && json.data.length > 0) {
      console.log('\nFIRST SAMPLE RECORD:');
      console.log(JSON.stringify(json.data[0], null, 2));
    } else {
      console.warn('No data array returned or data array is empty!');
    }

    return true;
  } catch (error) {
    console.error(`Failed to connect or test ${url}:`, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('Starting Polar Science Hub API Verification Suite...');

  const oceanOk = await testEndpoint(
    'Southern Ocean Climatology Data',
    'http://localhost:5000/api/v1/scientific/ocean'
  );

  const iceOk = await testEndpoint(
    'Dome Fuji Antarctic Ice Core Data',
    'http://localhost:5000/api/v1/scientific/ice-core'
  );

  console.log('\n' + '='.repeat(70));
  if (oceanOk && iceOk) {
    console.log('ALL API ENDPOINT VERIFICATIONS PASSED SUCCESSFULLY!');
  } else {
    console.error('ONE OR MORE ENDPOINT TESTS FAILED.');
    process.exitCode = 1;
  }
  console.log('='.repeat(70));
}

if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests };
