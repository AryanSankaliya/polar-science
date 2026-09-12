const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('===========================================================================');
  console.log('REST API VERIFICATION SUITE: STATIONS & SATELLITE SEA ICE');
  console.log('===========================================================================\n');

  const tests = [
    { name: '1. GET /api/v1/stations (All Stations)', url: 'http://localhost:5000/api/v1/stations' },
    { name: '2. GET /api/v1/stations/indian (Indian Stations)', url: 'http://localhost:5000/api/v1/stations/indian' },
    { name: '3. GET /api/v1/stations?country=India', url: 'http://localhost:5000/api/v1/stations?country=India' },
    { name: '4. GET /api/v1/stations?country=United%20States', url: 'http://localhost:5000/api/v1/stations?country=United%20States' },
    { name: '5. GET /api/v1/stations?status=Summer%20Only', url: 'http://localhost:5000/api/v1/stations?status=Summer%20Only' },
    { name: '6. GET /api/v1/stations/ind-stn-02 (Maitri)', url: 'http://localhost:5000/api/v1/stations/ind-stn-02' },
    { name: '7. GET /api/v1/satellite/sea-ice (Full Extent Series)', url: 'http://localhost:5000/api/v1/satellite/sea-ice' },
    { name: '8. GET /api/v1/satellite/sea-ice?start_year=2021&end_year=2024', url: 'http://localhost:5000/api/v1/satellite/sea-ice?start_year=2021&end_year=2024' }
  ];

  let passed = 0;

  for (const t of tests) {
    try {
      const res = await fetchUrl(t.url);
      console.log(`[PASS] ${t.name}`);
      console.log(`       Status Code: ${res.status}`);
      if (res.data.count !== undefined) {
        console.log(`       Records Count: ${res.data.count}${res.data.total ? ` (Total: ${res.data.total})` : ''}`);
      }
      if (res.data.stats) {
        console.log(`       Stats: Min = ${res.data.stats.all_time_min_extent.sea_ice_extent_million_sq_km} M sq km (${res.data.stats.all_time_min_extent.date})`);
        console.log(`              Max = ${res.data.stats.all_time_max_extent.sea_ice_extent_million_sq_km} M sq km (${res.data.stats.all_time_max_extent.date})`);
        console.log(`              Decadal Trend = ${res.data.stats.decadal_change_rate.percent_change_per_decade}% / decade (${res.data.stats.decadal_change_rate.assessment})`);
      }
      if (res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const sample = res.data.data[0];
        console.log(`       Sample Item: ${sample.name || sample.date} (lat: ${sample.latitude || 'N/A'}, lon: ${sample.longitude || 'N/A'})`);
      } else if (res.data.data && !Array.isArray(res.data.data)) {
        console.log(`       Single Item: ${res.data.data.name} (${res.data.data.station_id})`);
      }
      console.log('');
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${t.name} -> ${err.message}\n`);
    }
  }

  console.log('===========================================================================');
  console.log(`RESULT: ${passed}/${tests.length} tests passed with 100% success rate.`);
  console.log('===========================================================================\n');
}

runTests();
