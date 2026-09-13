import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleAIQuery, warmupModel } from './aiController.js';
import { isApiKeyConfigured } from './geminiClient.js';
import { initRetriever } from './retrieverService.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment configuration
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

let isWarmedUp = false;

// Pre-warm in-memory vector cache & fast model selection on server boot
initRetriever().then(() => {
  console.log('⚡ [Retriever] In-memory polar vector cache pre-warmed and ready.');
  return warmupModel();
}).then(() => {
  isWarmedUp = true;
  console.log('⚡ [LLM] Generation model selection verified and cached in memory.');
}).catch(err => {
  isWarmedUp = true;
  console.warn('[Warmup] Boot pre-warm notice:', err.message);
});

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ origin: corsOrigin === '*' ? '*' : corsOrigin.split(',') }));
app.use(express.json());

// Service Health & Metadata Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'SIH 2026 Polar AI Microservice',
    port: Number(PORT),
    geminiKeyConfigured: isApiKeyConfigured(),
    warmedUp: isWarmedUp,
    timestamp: new Date().toISOString()
  });
});

// Root welcome route with usage information
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'SIH 2026 Polar AI Microservice is online.',
    endpoints: {
      health: 'GET /health',
      query: 'POST /api/query',
      queryAlias: 'POST /api/ai/query'
    },
    samplePayload: {
      question: 'Explain the formation of Antarctic Bottom Water.',
      mode: 'student | researcher'
    }
  });
});

// Primary AI Query Endpoints (Direct and alias for drop-in teammate compatibility)
app.post('/api/query', handleAIQuery);
app.post('/api/ai/query', handleAIQuery);
app.post('/api/ai/ask', handleAIQuery);

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.url}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack || err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: err.message
  });
});

// Start listening if run directly
const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`❄️  SIH 2026 Polar AI Microservice`);
  console.log(`🚀 Running in isolated test mode on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 Query endpoint: POST http://localhost:${PORT}/api/query`);
  console.log(`🔑 Gemini Key Configured: ${isApiKeyConfigured() ? 'YES' : 'NO (add in .env)'}`);
  console.log('====================================================');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`\n❄️  [AI Module Notice] Port ${PORT} is ALREADY running and active!`);
    console.log(`    (The AI Microservice is already online on http://localhost:${PORT})\n`);
  } else {
    console.error('Server error:', err);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default app;
