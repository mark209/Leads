const buildApp = require('../app');

async function run() {
  const mockService = {
    appendLeadCalls: [],
    async appendLead(lead, fingerprint) {
      this.appendLeadCalls.push({ lead, fingerprint });
    }
  };

  const app = buildApp({
    googleSheetsService: mockService,
    fingerprintCache: new Set(['existing@example.com-3055551111-9000'])
  });

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  const payload = {
    Date_Posted: '2026-04-09T10:15:30.000Z',
    Landing_Page: 'example.com/landing',
    IP_Address: '203.0.113.10',
    Universal_LeadiD: 'abc123xyz',
    Trusted_Form_URL: 'cert.trustedform.com/123456',
    First_Name: 'Jane',
    Last_Name: 'Doe',
    City: 'Miami',
    State: 'fl',
    Zip: '33101',
    Primary_Phone: '(305) 555-0199',
    Email: 'Jane.Doe@Example.com',
    Total_Debt: 15000
  };

  const tests = [
    {
      name: 'accepted lead',
      body: payload,
      expectedCode: 200,
      expectedReason: null
    },
    {
      name: 'duplicate lead from cache',
      body: {
        ...payload,
        Email: 'existing@example.com',
        Primary_Phone: '305-555-1111',
        Total_Debt: 9000
      },
      expectedCode: 409,
      expectedReason: 'DUPLICATE_LEAD'
    },
    {
      name: 'blocked state',
      body: {
        ...payload,
        State: 'wa'
      },
      expectedCode: 400,
      expectedReason: 'STATE_NOT_ALLOWED'
    },
    {
      name: 'validation error missing field',
      body: {
        ...payload,
        Email: ''
      },
      expectedCode: 400,
      expectedReason: 'VALIDATION_ERROR'
    }
  ];

  let failed = 0;

  for (const test of tests) {
    const response = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test.body)
    });

    const data = await response.json();

    const codeOk = response.status === test.expectedCode;
    const reasonOk = test.expectedReason ? data.reason === test.expectedReason : data.status === 'accepted';

    if (codeOk && reasonOk) {
      console.log(`PASS: ${test.name}`);
    } else {
      failed += 1;
      console.log(`FAIL: ${test.name}`);
      console.log(`  expected status ${test.expectedCode}, got ${response.status}`);
      console.log(`  response: ${JSON.stringify(data)}`);
    }
  }

  if (mockService.appendLeadCalls.length !== 1) {
    failed += 1;
    console.log(`FAIL: appendLead expected 1 call, got ${mockService.appendLeadCalls.length}`);
  } else {
    console.log('PASS: appendLead invoked once for accepted lead');
  }

  server.close();

  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
