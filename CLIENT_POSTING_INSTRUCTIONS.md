# Client Posting Instructions

## 1. Base URL
After Render deploy, your live base URL will look like:

`https://apilead-ingestion-api.onrender.com`

Use this endpoint:

`POST /api/leads`

Full URL example:

`https://apilead-ingestion-api.onrender.com/api/leads`

## 2. Required Headers

- `Content-Type: application/json`

## 3. Payload Schema (all required)

```json
{
  "Date_Posted": "ISO date string",
  "Landing_Page": "https://...",
  "IP_Address": "string",
  "Universal_LeadiD": "string",
  "Trusted_Form_URL": "https://...",
  "First_Name": "string",
  "Last_Name": "string",
  "City": "string",
  "State": "2-letter state",
  "Zip": "string",
  "Primary_Phone": "string",
  "Email": "string",
  "Total_Debt": 15000
}
```

## 4. Example cURL Request

```bash
curl -X POST "https://apilead-ingestion-api.onrender.com/api/leads" \
  -H "Content-Type: application/json" \
  -d '{
    "Date_Posted": "2026-04-09T12:45:00.000Z",
    "Landing_Page": "https://example.com/debt-relief",
    "IP_Address": "198.51.100.27",
    "Universal_LeadiD": "client-live-001",
    "Trusted_Form_URL": "https://cert.trustedform.com/7891011",
    "First_Name": "Michael",
    "Last_Name": "Smith",
    "City": "Orlando",
    "State": "FL",
    "Zip": "32801",
    "Primary_Phone": "(407) 555-2277",
    "Email": "michael.smith@example.com",
    "Total_Debt": 22000
  }'
```

## 5. Response Contract

### Accepted (HTTP 200)

```json
{
  "status": "accepted"
}
```

### Blocked State (HTTP 400)

```json
{
  "status": "rejected",
  "reason": "STATE_NOT_ALLOWED"
}
```

### Validation Issue (HTTP 400)

```json
{
  "status": "rejected",
  "reason": "VALIDATION_ERROR",
  "details": "..."
}
```

### Duplicate Lead (HTTP 409)

```json
{
  "status": "rejected",
  "reason": "DUPLICATE_LEAD"
}
```

### Server Error (HTTP 500)

```json
{
  "status": "rejected",
  "reason": "INTERNAL_ERROR"
}
```

## 6. Notes for Client Integrations

- Email is normalized to lowercase.
- Phone is stored digits-only (non-numeric characters removed).
- State is normalized to uppercase.
- Duplicate detection key is: `email + phone + Total_Debt`.
- Do not rely on retries with identical payload if you already received HTTP 200.

## 7. Recommended Client Retry Rules

- Retry on: `HTTP 500`, network timeout, or connection errors.
- Do not retry on: `HTTP 400` and `HTTP 409`.
- Retry strategy: exponential backoff (e.g., 2s, 5s, 10s, max 3 attempts).