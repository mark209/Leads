const {
  BLOCKED_STATES,
  normalizeLead,
  validateLeadPayload,
  buildFingerprint
} = require('../utils/validation');

async function createLead(req, res) {
  const inFlightFingerprints = req.app.locals.inFlightFingerprints;

  try {
    const normalizedLead = normalizeLead(req.body || {});
    const validation = validateLeadPayload(normalizedLead);

    if (!validation.valid) {
      return res.status(validation.statusCode).json(validation.error);
    }

    if (BLOCKED_STATES.has(normalizedLead.State)) {
      return res.status(400).json({
        status: 'rejected',
        reason: 'STATE_NOT_ALLOWED'
      });
    }

    const fingerprint = buildFingerprint(normalizedLead);
    const fingerprintCache = req.app.locals.fingerprintCache;

    if (inFlightFingerprints.has(fingerprint)) {
      return res.status(409).json({
        status: 'rejected',
        reason: 'DUPLICATE_LEAD'
      });
    }

    if (fingerprintCache.has(fingerprint)) {
      return res.status(409).json({
        status: 'rejected',
        reason: 'DUPLICATE_LEAD'
      });
    }

    inFlightFingerprints.add(fingerprint);
    try {
      await req.app.locals.googleSheetsService.appendLead(normalizedLead, fingerprint);
      fingerprintCache.add(fingerprint);
    } finally {
      inFlightFingerprints.delete(fingerprint);
    }

    return res.status(200).json({
      status: 'accepted'
    });
  } catch (error) {
    console.error('Lead ingestion failed:', error.message);

    return res.status(500).json({
      status: 'rejected',
      reason: 'INTERNAL_ERROR'
    });
  }
}

module.exports = {
  createLead
};
