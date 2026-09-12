const path = require('path');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const { connectToDatabase, closeDatabase } = require('./Configuration/database');
const { CORS_ORIGINS, PORT: CONFIG_PORT } = require('./Configuration/polarConfig');
const swaggerDocument = require('./Configuration/swaggerConfig');
const errorHandler = require('./Middleware/errorHandler');
const { apiLimiter } = require('./Middleware/rateLimiter');

// Legacy routes preserved for 100% backward compatibility
const scientificRoutes = require('./routes/scientificRoutes');
const aiRoutes = require('./routes/aiRoutes');
const expeditionRoutes = require('./routes/expeditionRoutes');
const outreachRoutes = require('./routes/outreachRoutes');
const stationRoutes = require('./routes/stationRoutes');
const satelliteRoutes = require('./routes/satelliteRoutes');
const mediaRoutes = require('./routes/mediaRoutes');

// Modern unified API routes
const unifiedApiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || CONFIG_PORT || 5000;

// CORS configuration (allowing React frontend at localhost:5173 and other origins)
app.use(cors({
  origin: CORS_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Apply rate limiter to /api
app.use('/api', apiLimiter);

// Serve multimedia assets statically
app.use('/media', express.static(path.join(__dirname, '05_media')));
app.use('/media/images', express.static(path.join(__dirname, '05_media', 'Photos')));
app.use('/media/photos', express.static(path.join(__dirname, '05_media', 'Photos')));
app.use('/media/videos', express.static(path.join(__dirname, '05_media', 'videos')));

// ==========================================
// SWAGGER OPENAPI DOCUMENTATION
// ==========================================
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Polar Research Information Platform API Docs'
}));

app.use('/api/ai', aiRoutes);
app.use('/api', unifiedApiRoutes);

// ==========================================
// PRESERVED LEGACY ROUTES (/api/v1/*)
// ==========================================
app.use('/api/v1/scientific', scientificRoutes);
app.use('/api/v1/expeditions', expeditionRoutes);
app.use('/api/v1/outreach', outreachRoutes);
app.use('/api/v1/stations', stationRoutes);
app.use('/api/v1/satellite', satelliteRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Polar Research Information Platform API (NCPOR)',
    version: '1.0.0',
    documentation: `http://localhost:${PORT}/api/docs`,
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

const { fork } = require('child_process');

let server = null;
let aiModuleProcess = null;

function autoStartAiModule() {
  if (process.env.DISABLE_AUTO_AI === 'true' || process.env.npm_lifecycle_event === 'dev' || process.env.npm_lifecycle_event === 'dev:all') {
    console.log('❄️  [AI Module] Managed by root process runner.');
    return;
  }
  const aiModuleDir = path.join(__dirname, '../ai-module');
  const aiModuleServerPath = path.join(aiModuleDir, 'server.js');
  try {
    const aiEnv = { ...process.env };
    delete aiEnv.PORT;
    aiModuleProcess = fork(aiModuleServerPath, [], {
      cwd: aiModuleDir,
      env: { ...aiEnv, PORT: process.env.AI_MODULE_PORT || 5001 },
      stdio: 'inherit'
    });
    console.log('❄️  [AI Module] Auto-launched Polar AI Engine on Port 5001');
  } catch (err) {
    console.warn('⚠️  [AI Module] Could not auto-launch AI module:', err.message);
  }
}

async function startServer() {
  try {
    // Connect to MongoDB
    await connectToDatabase();

    // Auto-launch user's AI module seamlessly alongside Backend
    autoStartAiModule();

    server = app.listen(PORT, () => {
      console.log('='.repeat(70));
      console.log(` POLAR RESEARCH INFORMATION PLATFORM BACKEND (NCPOR)`);
      console.log('='.repeat(70));
      console.log(`Server URL:           http://localhost:${PORT}`);
      console.log(`Swagger OpenAPI Docs: http://localhost:${PORT}/api/docs`);
      console.log(`OpenAPI JSON Spec:    http://localhost:${PORT}/api/docs.json`);
      console.log(`Health Check:         http://localhost:${PORT}/api/health`);
      console.log(`Global Search:        http://localhost:${PORT}/api/search?q=climate`);
      console.log(`Interactive Map:      http://localhost:${PORT}/api/map/stations`);
      console.log(`Station Explorer:     http://localhost:${PORT}/api/stations`);
      console.log(`Dataset Explorer:     http://localhost:${PORT}/api/datasets`);
      console.log(`Knowledge Graph:      http://localhost:${PORT}/api/knowledge/graph`);
      console.log(`Expedition Timeline:  http://localhost:${PORT}/api/expeditions/timeline`);
      console.log(`AI Research Ask:      POST http://localhost:${PORT}/api/research/ask`);
      console.log(`RAG Citations Query:  POST http://localhost:${PORT}/api/rag/query`);
      console.log(`Human Review Engine:  http://localhost:${PORT}/api/reviews`);
      console.log(`Legacy v1 Routes:     Preserved at /api/v1/*`);
      console.log('='.repeat(70));
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n[ERROR] Port ${PORT} is already in use!`);
        console.error(`Another process (or previous server instance) is running on port ${PORT}.`);
        console.error(`To fix this:`);
        console.error(`  1. Stop the existing Node process: npx kill-port ${PORT} (or stop running terminals)`);
        console.error(`  2. Or change PORT in Backend/.env file.\n`);
      } else {
        console.error('Server error:', err);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down...');
  if (aiModuleProcess) aiModuleProcess.kill();
  if (server) server.close();
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nGracefully shutting down...');
  if (aiModuleProcess) aiModuleProcess.kill();
  if (server) server.close();
  await closeDatabase();
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
