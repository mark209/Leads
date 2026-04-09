const express = require('express');
const leadsRoutes = require('./routes/leadsRoutes');

function buildApp({ googleSheetsService, fingerprintCache }) {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  app.locals.googleSheetsService = googleSheetsService;
  app.locals.fingerprintCache = fingerprintCache;

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api', leadsRoutes);

  app.use((err, _req, res, _next) => {
    console.error('Unhandled application error:', err);
    res.status(500).json({ status: 'rejected', reason: 'INTERNAL_ERROR' });
  });

  return app;
}

module.exports = buildApp;