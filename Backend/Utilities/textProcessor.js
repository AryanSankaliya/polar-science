/**
 * Text Processing Utility for Chunking, Keywords, and Sanitization
 */

function escapeRegex(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Splits document text into overlapping chunks with metadata.
 * @param {string} text 
 * @param {number} chunkSize Characters per chunk (default 1000)
 * @param {number} overlap Characters overlap (default 150)
 * @returns {Array<{ chunkIndex: number, text: string, charLength: number }>}
 */
function chunkText(text, chunkSize = 1000, overlap = 150) {
  if (!text || typeof text !== 'string') return [];
  const clean = text.replace(/\r\n/g, '\n').trim();
  if (clean.length <= chunkSize) {
    return [{ chunkIndex: 0, text: clean, charLength: clean.length }];
  }

  const chunks = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < clean.length) {
    let endIndex = startIndex + chunkSize;
    if (endIndex < clean.length) {
      // Find nearest sentence or paragraph boundary
      const nextNewline = clean.lastIndexOf('\n', endIndex);
      const nextPeriod = clean.lastIndexOf('. ', endIndex);
      const breakPoint = Math.max(nextNewline, nextPeriod);
      if (breakPoint > startIndex + Math.floor(chunkSize * 0.6)) {
        endIndex = breakPoint + (breakPoint === nextPeriod ? 2 : 1);
      }
    } else {
      endIndex = clean.length;
    }

    const chunkContent = clean.slice(startIndex, endIndex).trim();
    if (chunkContent.length > 0) {
      chunks.push({
        chunkIndex,
        text: chunkContent,
        charLength: chunkContent.length
      });
      chunkIndex++;
    }

    startIndex = endIndex - overlap;
    if (startIndex >= clean.length - overlap) {
      break;
    }
  }

  return chunks;
}

/**
 * Extracts salient keywords from text.
 * @param {string} text 
 * @param {number} maxKeywords 
 * @returns {string[]}
 */
function extractKeywords(text, maxKeywords = 10) {
  if (!text || typeof text !== 'string') return [];
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of', 'with', 'as', 'by',
    'that', 'from', 'this', 'were', 'was', 'are', 'been', 'their', 'has', 'have', 'had', 'or', 'be',
    'it', 'its', 'these', 'those', 'such', 'into', 'can', 'will', 'also', 'about', 'than', 'more',
    'over', 'after', 'between', 'through', 'during', 'under', 'all', 'any', 'each', 'both', 'few'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  const freq = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(entry => entry[0]);
}

module.exports = {
  escapeRegex,
  chunkText,
  extractKeywords
};
