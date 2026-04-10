const REQUIRED_FIELDS = [
  'Date_Posted',
  'Landing_Page',
  'IP_Address',
  'Universal_LeadiD',
  'Trusted_Form_URL',
  'First_Name',
  'Last_Name',
  'City',
  'State',
  'Zip',
  'Primary_Phone',
  'Email',
  'Total_Debt'
];

const BLOCKED_STATES = new Set([
  'AK', 'CT', 'DE', 'HI', 'IA', 'ID', 'MT', 'NE', 'NH', 'NM', 'NV', 'OR', 'SD', 'UT', 'VT', 'WA', 'WV', 'WY'
]);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STATE_REGEX = /^[A-Z]{2}$/;

function normalizeUrl(value) {
  const input = String(value || '').trim();

  if (!input) {
    return '';
  }

  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  return `https://${input}`;
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeLead(rawLead) {
  return {
    ...rawLead,
    Email: String(rawLead.Email || '').trim().toLowerCase(),
    Primary_Phone: String(rawLead.Primary_Phone || '').replace(/\D/g, ''),
    State: String(rawLead.State || '').trim().toUpperCase(),
    Total_Debt: Number(rawLead.Total_Debt),
    Landing_Page: normalizeUrl(rawLead.Landing_Page),
    Trusted_Form_URL: normalizeUrl(rawLead.Trusted_Form_URL)
  };
}

function validateLeadPayload(lead) {
  const missingFields = REQUIRED_FIELDS.filter((field) => {
    const value = lead[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return {
      valid: false,
      statusCode: 400,
      error: {
        status: 'rejected',
        reason: 'VALIDATION_ERROR',
        details: `Missing required fields: ${missingFields.join(', ')}`
      }
    };
  }

  if (Number.isNaN(Date.parse(lead.Date_Posted))) {
    return {
      valid: false,
      statusCode: 400,
      error: {
        status: 'rejected',
        reason: 'VALIDATION_ERROR',
        details: 'Date_Posted must be a valid ISO date string'
      }
    };
  }

  if (!isValidUrl(lead.Landing_Page) || !isValidUrl(lead.Trusted_Form_URL)) {
    return {
      valid: false,
      statusCode: 400,
      error: {
        status: 'rejected',
        reason: 'VALIDATION_ERROR',
        details: 'Landing_Page and Trusted_Form_URL must be valid URLs'
      }
    };
  }

  if (!EMAIL_REGEX.test(lead.Email)) {
    return {
      valid: false,
      statusCode: 400,
      error: {
        status: 'rejected',
        reason: 'VALIDATION_ERROR',
        details: 'Email must be valid'
      }
    };
  }

  if (!STATE_REGEX.test(lead.State)) {
    return {
      valid: false,
      statusCode: 400,
      error: {
        status: 'rejected',
        reason: 'VALIDATION_ERROR',
        details: 'State must be a 2-letter code'
      }
    };
  }

  if (!Number.isFinite(lead.Total_Debt)) {
    return {
      valid: false,
      statusCode: 400,
      error: {
        status: 'rejected',
        reason: 'VALIDATION_ERROR',
        details: 'Total_Debt must be a number'
      }
    };
  }

  if (!lead.Primary_Phone) {
    return {
      valid: false,
      statusCode: 400,
      error: {
        status: 'rejected',
        reason: 'VALIDATION_ERROR',
        details: 'Primary_Phone must contain at least one digit'
      }
    };
  }

  return { valid: true };
}

function buildFingerprint(lead) {
  return `${lead.Email}-${lead.Primary_Phone}-${lead.Total_Debt}`;
}

module.exports = {
  BLOCKED_STATES,
  normalizeLead,
  validateLeadPayload,
  buildFingerprint
};
