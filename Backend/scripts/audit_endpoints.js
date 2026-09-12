async function audit() {
  const endpoints = [
    { name: 'System Health', url: 'http://localhost:5000/api/system/health' },
    { name: 'System Stats', url: 'http://localhost:5000/api/system/stats' },
    { name: 'Stations (All)', url: 'http://localhost:5000/api/stations' },
    { name: 'Indian Stations', url: 'http://localhost:5000/api/stations/indian' },
    { name: 'Station Detail (Bharati)', url: 'http://localhost:5000/api/stations/ind-stn-03' },
    { name: 'Station Detail (Maitri)', url: 'http://localhost:5000/api/stations/ind-stn-02' },
    { name: 'Expeditions (All)', url: 'http://localhost:5000/api/expeditions' },
    { name: 'Expedition Timeline', url: 'http://localhost:5000/api/expeditions/timeline' },
    { name: 'Expedition Detail (exp_054)', url: 'http://localhost:5000/api/expeditions/exp_054' },
    { name: 'Researchers (All)', url: 'http://localhost:5000/api/researchers' },
    { name: 'Researcher Detail (res_005)', url: 'http://localhost:5000/api/researchers/res_005' },
    { name: 'Projects (All)', url: 'http://localhost:5000/api/projects' },
    { name: 'Project Detail (PACER-GLACIO-01)', url: 'http://localhost:5000/api/projects/PACER-GLACIO-01' },
    { name: 'Publications (All)', url: 'http://localhost:5000/api/publications' },
    { name: 'Publication Detail (pub_002)', url: 'http://localhost:5000/api/publications/pub_002' },
    { name: 'Datasets (All)', url: 'http://localhost:5000/api/datasets' },
    { name: 'Dataset Detail (DS-ICE-001)', url: 'http://localhost:5000/api/datasets/DS-ICE-001' },
    { name: 'Media (All)', url: 'http://localhost:5000/api/media' },
    { name: 'Facilities (All)', url: 'http://localhost:5000/api/facilities' },
    { name: 'Science Disciplines', url: 'http://localhost:5000/api/science' },
    { name: 'Environment Records', url: 'http://localhost:5000/api/environment' },
    { name: 'Antarctica Info', url: 'http://localhost:5000/api/antarctica/info' },
    { name: 'Arctic Info', url: 'http://localhost:5000/api/arctic/info' },
    { name: 'Knowledge Graph', url: 'http://localhost:5000/api/knowledge/graph' },
    { name: 'Outreach Records', url: 'http://localhost:5000/api/outreach' },
    { name: 'Global Search', url: 'http://localhost:5000/api/search?q=Antarctica' },
    { name: 'RAG Vectors', url: 'http://localhost:5000/api/rag/vectors', method: 'POST', body: { query: 'ice core' } },
    { name: 'AI Ask', url: 'http://localhost:5000/api/research/ask', method: 'POST', body: { question: 'What is Maitri station?' } }
  ];

  console.log('=' .repeat(60));
  console.log('BACKEND ENDPOINTS COMPREHENSIVE AUDIT');
  console.log('=' .repeat(60));

  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    try {
      const opts = ep.method ? {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ep.body)
      } : {};
      const res = await fetch(ep.url, opts);
      const data = await res.json();
      const count = Array.isArray(data.data) ? data.data.length : (data.data ? 1 : (data.totalMatches || 'OK'));
      if (res.status === 200) {
        console.log(`[PASS] ${ep.name.padEnd(32)} HTTP 200 | items: ${count}`);
        passed++;
      } else {
        console.log(`[FAIL] ${ep.name.padEnd(32)} HTTP ${res.status} | error: ${data.message || JSON.stringify(data)}`);
        failed++;
      }
    } catch (e) {
      console.log(`[ERR ] ${ep.name.padEnd(32)} ${e.message}`);
      failed++;
    }
  }

  console.log('=' .repeat(60));
  console.log(`AUDIT RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log('=' .repeat(60));
}

audit();
