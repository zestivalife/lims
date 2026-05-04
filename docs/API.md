# API Reference

Base URL: `http://localhost:3001`

## Auth

- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/otp/send`
- `POST /api/auth/otp/verify`

## Onboarding

- `POST /api/onboarding/step1`
- `POST /api/onboarding/step2`
- `POST /api/onboarding/step3`
- `POST /api/onboarding/step4`
- `POST /api/onboarding/step5`
- `POST /api/onboarding/step6`
- `POST /api/onboarding/step7`
- `GET /api/onboarding/status`

## Patients

- `GET /api/patients`
- `POST /api/patients`
- `GET /api/patients/:id`
- `PUT /api/patients/:id`
- `GET /api/patients/:id/history`
- `POST /api/patients/merge`

## Tests

- `GET /api/tests/catalog`
- `POST /api/tests/orders`
- `GET /api/tests/orders/:id`
- `PUT /api/tests/orders/:id/status`
- `POST /api/tests/results/manual`
- `GET /api/tests/results/:orderId`

## Reports

- `POST /api/reports/generate`
- `POST /api/reports/:id/sign`
- `GET /api/reports/:id/download`
- `POST /api/reports/:id/deliver`
- `GET /api/reports/portal/my`

## Analyzers

- `GET /api/analyzers`
- `POST /api/analyzers`
- `PUT /api/analyzers/:id`
- `POST /api/analyzers/:id/test-connection`
- `GET /api/analyzers/:id/logs`
- `POST /api/analyzers/mapping`

## Compliance

- `GET /api/compliance/audit-log`
- `GET /api/compliance/policies/:region`
- `POST /api/compliance/consent`
- `GET /api/compliance/report`

## Billing

- `GET /api/billing/invoices`
- `GET /api/billing/summary`

## Internal

- `POST /api/internal/results` (firewall protected + `x-internal-token`)

## Auth Header

All protected routes require:

```http
Authorization: Bearer <accessToken>
```

## Internal Results Payload

```json
{
  "orderId": "cuid-order-id",
  "patientId": "patient-id",
  "testCode": "CBC",
  "value": "12.8",
  "unit": "g/dL",
  "referenceRange": "12-15",
  "machineId": "analyzer-1",
  "rawMessage": "MSH|...",
  "timestamp": "2026-04-23T10:40:00.000Z"
}
```
