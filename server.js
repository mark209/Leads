require('dotenv').config();

const buildApp = require('./app');
const GoogleSheetsService = require('./services/googleSheetsService');

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  try {
    const googleSheetsService = new GoogleSheetsService();
    const fingerprintCache = await googleSheetsService.loadFingerprints();

    const app = buildApp({ googleSheetsService, fingerprintCache });

    app.listen(PORT, () => {
      console.log(`Lead ingestion API running on port ${PORT}`);
      console.log(`Loaded ${fingerprintCache.size} fingerprint(s) into memory cache`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();