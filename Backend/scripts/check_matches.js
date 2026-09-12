const fs = require('fs');
const content = fs.readFileSync('Frontend/moes-polar-portal/assets/index-v2.js.bak', 'utf8');

function testMatch(label, target) {
  const idx = content.indexOf(target);
  console.log(label, idx !== -1 ? 'MATCHED at ' + idx : 'NOT MATCHED');
  if (idx === -1) {
    const firstLine = target.split('\r\n')[0].split('\n')[0].trim();
    console.log('  Trying first line:', firstLine, '=>', content.indexOf(firstLine));
  }
}

testMatch('primaryNav', '/* Primary visible nav items */');
testMatch('desktopControls', '/* Search & Toggle Controls */');
testMatch('owHeader', '/* Top 6-Tier Repository Hub Header */');
testMatch('cardDownload', '/* Primary 1-Click Action: Direct Browser File Download */');
testMatch('kcState', 'function KC(){');
testMatch('kcReturn', 'u.jsx(Y1,{theme:theme}),');

// Check line endings
console.log('Has \\r\\n:', content.includes('\r\n'));
