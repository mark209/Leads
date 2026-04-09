# Lead Ingestion API

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

or

```bash
npm start
```

## Endpoint

`POST /api/leads`

### Example Request

```http
POST /api/leads HTTP/1.1
Content-Type: application/json
```

```json
{
  "Date_Posted": "2026-04-09T10:15:30.000Z",
  "Landing_Page": "https://example.com/landing",
  "IP_Address": "203.0.113.10",
  "Universal_LeadiD": "abc123xyz",
  "Trusted_Form_URL": "https://cert.trustedform.com/123456",
  "First_Name": "Jane",
  "Last_Name": "Doe",
  "City": "Miami",
  "State": "fl",
  "Zip": "33101",
  "Primary_Phone": "(305) 555-0199",
  "Email": "Jane.Doe@Example.com",
  "Total_Debt": 15000
}
```

### Success Response (200)

```json
{
  "status": "accepted"
}
```

### Blocked State Response (400)

```json
{
  "status": "rejected",
  "reason": "STATE_NOT_ALLOWED"
}
```

### Duplicate Response (409)

```json
{
  "status": "rejected",
  "reason": "DUPLICATE_LEAD"
}
```

## Deploy to Render

1. Push this project to GitHub/GitLab/Bitbucket (must include `render.yaml`).
2. In Render Dashboard, click `New +` -> `Blueprint`.
3. Select your repo.
4. Fill these required env vars when prompted:
   - `GOOGLE_SHEET_ID`
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
5. Deploy.

The service uses:
- Health check: `GET /health`
- API endpoint: `POST /api/leads`

Client handoff doc:
- `CLIENT_POSTING_INSTRUCTIONS.md`
