const { google } = require('googleapis');

const SHEET_HEADERS = [
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
  'Total_Debt',
  'fingerprint'
];

class GoogleSheetsService {
  constructor() {
    this.sheetId = process.env.GOOGLE_SHEET_ID;
    this.clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    this.privateKey = this.normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);
    this.sheetName = process.env.GOOGLE_SHEET_NAME || 'Leads';

    if (!this.sheetId || !this.clientEmail || !this.privateKey) {
      throw new Error('Missing Google Sheets configuration. Check GOOGLE_SHEET_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: this.clientEmail,
        private_key: this.privateKey
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    this.sheetsApi = google.sheets({ version: 'v4', auth });
  }

  normalizePrivateKey(rawValue) {
    if (!rawValue) return rawValue;

    return rawValue
      .trim()
      .replace(/^"(.*)"$/, '$1')
      .replace(/\\\\n/g, '\n')
      .replace(/\\n/g, '\n');
  }

  getSheetRange(rangeSuffix) {
    const escapedName = this.sheetName.replace(/'/g, "''");
    return `'${escapedName}'!${rangeSuffix}`;
  }

  async ensureSheetExists() {
    const metadata = await this.sheetsApi.spreadsheets.get({
      spreadsheetId: this.sheetId,
      fields: 'sheets(properties(title))'
    });

    const titles = (metadata.data.sheets || []).map((sheet) => sheet.properties?.title).filter(Boolean);
    if (titles.includes(this.sheetName)) {
      return;
    }

    await this.sheetsApi.spreadsheets.batchUpdate({
      spreadsheetId: this.sheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: this.sheetName }
            }
          }
        ]
      }
    });
  }

  async ensureHeaders() {
    await this.ensureSheetExists();

    const response = await this.sheetsApi.spreadsheets.values.get({
      spreadsheetId: this.sheetId,
      range: this.getSheetRange('A1:N1')
    });

    const existingHeaders = response.data.values?.[0] || [];

    if (existingHeaders.length === SHEET_HEADERS.length && SHEET_HEADERS.every((h, i) => h === existingHeaders[i])) {
      return;
    }

    await this.sheetsApi.spreadsheets.values.update({
      spreadsheetId: this.sheetId,
      range: this.getSheetRange('A1:N1'),
      valueInputOption: 'RAW',
      requestBody: {
        values: [SHEET_HEADERS]
      }
    });
  }

  async loadFingerprints() {
    await this.ensureHeaders();

    const response = await this.sheetsApi.spreadsheets.values.get({
      spreadsheetId: this.sheetId,
      range: this.getSheetRange('N2:N')
    });

    const rows = response.data.values || [];
    return new Set(rows.map((row) => row[0]).filter(Boolean));
  }

  async appendLead(lead, fingerprint) {
    const values = [[
      lead.Date_Posted,
      lead.Landing_Page,
      lead.IP_Address,
      lead.Universal_LeadiD,
      lead.Trusted_Form_URL,
      lead.First_Name,
      lead.Last_Name,
      lead.City,
      lead.State,
      lead.Zip,
      lead.Primary_Phone,
      lead.Email,
      lead.Total_Debt,
      fingerprint
    ]];

    await this.sheetsApi.spreadsheets.values.append({
      spreadsheetId: this.sheetId,
      range: this.getSheetRange('A:N'),
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values
      }
    });
  }
}

module.exports = GoogleSheetsService;
