/**
 * Verification Test Script: test-all-stations.js
 * 
 * Tests the real running AI service on port 5001 for complete 3-station coverage:
 * - Maitri Station (Active)
 * - Bharati Station (Active)
 * - Dakshin Gangotri (Historical / First Station)
 * 
 * Verifies all 6 required assertions:
 * 1. API Success (HTTP 200, valid schema)
 * 2. Maitri Station (* **Maitri Station:**)
 * 3. Bharati Station (* **Bharati Station:**)
 * 4. Dakshin Gangotri (* **Dakshin Gangotri:**)
 * 5. Sub-bullets (** ) under each of the three stations
 * 6. No comma-joined multi-item research lists
 */

const ENDPOINT = 'http://localhost:5001/api/ai/ask';

async function runTest() {
  const payload = {
    question: "What are the Indian Antarctic research stations and what research activities are carried out at each?",
    mode: "researcher"
  };

  let response;
  let data;
  let httpStatus = 0;

  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    httpStatus = response.status;
    data = await response.json();
  } catch (err) {
    console.error(`Error connecting to AI service at ${ENDPOINT}:`, err.message);
    console.log('\n================================================================================');
    console.log('THREE-STATION COVERAGE TEST');
    console.log('================================================================================');
    console.log(`HTTP Status: ${httpStatus || 'CONNECTION FAILED'}`);
    console.log('API Response: FAIL');
    console.log('FINAL RESULT\nFAIL');
    process.exit(1);
  }

  // ASSERTION 1 — API SUCCESS
  const assertion1 = httpStatus === 200 && data && data.success === true && typeof data.answer === 'string' && data.answer.trim().length > 0;
  
  const answer = data?.answer || '';

  // ASSERTION 2 — MAITRI
  const assertion2 = answer.includes('* **Maitri Station:**');

  // ASSERTION 3 — BHARATI
  const assertion3 = answer.includes('* **Bharati Station:**');

  // ASSERTION 4 — DAKSHIN GANGOTRI
  const assertion4 = answer.includes('* **Dakshin Gangotri:**');

  // ASSERTION 5 — SUB-BULLETS under each of the three stations
  let maitriSubBulletsPass = false;
  let bharatiSubBulletsPass = false;
  let dgSubBulletsPass = false;

  const idxMaitri = answer.indexOf('* **Maitri Station:**');
  const idxBharati = answer.indexOf('* **Bharati Station:**');
  const idxDG = answer.indexOf('* **Dakshin Gangotri:**');

  if (idxMaitri !== -1 && idxBharati !== -1 && idxDG !== -1) {
    // Extract each station's section
    const maitriSection = answer.substring(idxMaitri, idxBharati);
    const bharatiSection = answer.substring(idxBharati, idxDG);
    const dgSection = answer.substring(idxDG);

    const hasSubBullets = (text) => text.split('\n').some(line => line.trim().startsWith('** '));

    maitriSubBulletsPass = hasSubBullets(maitriSection);
    bharatiSubBulletsPass = hasSubBullets(bharatiSection);
    dgSubBulletsPass = hasSubBullets(dgSection);
  }

  // ASSERTION 6 — NO COMMA-JOINED RESEARCH LIST
  // Detects multi-item comma-joined research lists like: "earth sciences, meteorology, glaciology, and..."
  // while allowing normal descriptive commas within a single bullet.
  const commaJoinedListRegex = /(?:activities|disciplines|research|studies|focus areas)\s+(?:include|focus on|are|carried out|focusing on)\s+[^.\n]+,\s+[^.\n]+,\s*(?:and|or)\b/i;
  const researchDisciplineChainRegex = /(?:earth sciences|meteorology|glaciology|oceanography|biology),\s*(?:earth sciences|meteorology|glaciology|oceanography|biology|environmental)/i;
  
  const hasCommaJoinedList = commaJoinedListRegex.test(answer) || researchDisciplineChainRegex.test(answer);
  const assertion6 = !hasCommaJoinedList;

  const allPassed = assertion1 &&
                    assertion2 &&
                    assertion3 &&
                    assertion4 &&
                    maitriSubBulletsPass &&
                    bharatiSubBulletsPass &&
                    dgSubBulletsPass &&
                    assertion6;

  console.log('================================================================================');
  console.log('THREE-STATION COVERAGE TEST');
  console.log('================================================================================\n');
  console.log(`HTTP Status: ${httpStatus}\n`);
  console.log(`API Response: ${assertion1 ? 'PASS' : 'FAIL'}`);
  console.log(`Maitri Station: ${assertion2 ? 'PASS' : 'FAIL'}`);
  console.log(`Bharati Station: ${assertion3 ? 'PASS' : 'FAIL'}`);
  console.log(`Dakshin Gangotri: ${assertion4 ? 'PASS' : 'FAIL'}`);
  console.log(`Maitri Sub-Bullets: ${maitriSubBulletsPass ? 'PASS' : 'FAIL'}`);
  console.log(`Bharati Sub-Bullets: ${bharatiSubBulletsPass ? 'PASS' : 'FAIL'}`);
  console.log(`Dakshin Gangotri Sub-Bullets: ${dgSubBulletsPass ? 'PASS' : 'FAIL'}`);
  console.log(`Comma-Separated Research List: ${assertion6 ? 'PASS' : 'FAIL'}`);
  console.log('\n--------------------------------------------------------------------------------');
  console.log('VERIFIED AI RESPONSE');
  console.log('--------------------------------------------------------------------------------\n');
  console.log(answer);
  console.log('\n--------------------------------------------------------------------------------');
  console.log('FINAL RESULT');
  console.log('--------------------------------------------------------------------------------\n');
  console.log(allPassed ? 'PASS' : 'FAIL');

  if (!allPassed) {
    process.exit(1);
  }
}

runTest();
