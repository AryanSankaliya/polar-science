/**
 * Vector Mathematics Utility for Semantic Similarity and TF-IDF / Embedding Ranking
 */

/**
 * Computes cosine similarity between two numeric vectors.
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number} Value between -1.0 and 1.0 (or 0.0 for zero vectors)
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0.0;
  }
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0.0 || normB === 0.0) {
    return 0.0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates a deterministic sparse/dense term embedding vector from text based on a fixed vocabulary hashing model.
 * Enables local semantic vector search without external paid API calls.
 * @param {string} text 
 * @param {number} dimensions 
 * @returns {number[]} Normalized float array
 */
function generateDeterministicEmbedding(text, dimensions = 128) {
  if (!text || typeof text !== 'string') {
    return new Array(dimensions).fill(0.0);
  }

  const vec = new Array(dimensions).fill(0.0);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return vec;
  }

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    // Hash word to dimension index
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash * 31 + word.charCodeAt(j)) >>> 0;
    }
    const idx = hash % dimensions;
    const sign = (hash % 2 === 0) ? 1.0 : -1.0;
    vec[idx] += sign * (1.0 + Math.log(1 + (words.length - i) / words.length));
  }

  // L2 Normalize
  let sumSq = 0.0;
  for (let i = 0; i < dimensions; i++) {
    sumSq += vec[i] * vec[i];
  }
  const mag = Math.sqrt(sumSq);
  if (mag > 0) {
    for (let i = 0; i < dimensions; i++) {
      vec[i] = parseFloat((vec[i] / mag).toFixed(6));
    }
  }

  return vec;
}

module.exports = {
  cosineSimilarity,
  generateDeterministicEmbedding
};
