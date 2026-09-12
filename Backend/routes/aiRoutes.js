const express = require('express');
const router = express.Router();
const { handleAIQuery } = require('../controllers/aiController');

/**
 * POST /api/v1/ai/query
 * Grounded AI Polar Assistant endpoint.
 * Synthesizes zero-hallucination answers citing live MongoDB numbers
 * and grounded expedition document chunks.
 * Accepts: { query, question, domain }
 */
router.post('/query', handleAIQuery);
router.post('/ask', handleAIQuery);
router.get('/health', (req, res) => res.json({ status: 'online', service: 'Polar AI Microservice Gateway' }));

module.exports = router;
