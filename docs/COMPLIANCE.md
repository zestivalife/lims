# Compliance Architecture

## Framework Readiness

- India: NABL
- USA: HIPAA
- EU: GDPR
- UK: GDPR + NHS-aligned controls
- Middle East: DHA / MOH
- ISO 17025 compatible process controls

## Data Protection Controls

- AES-256-GCM encryption for PII at rest:
  - Patient name
  - DOB
  - Phone
  - Email
  - Address
- TLS required in production ingress/proxy.
- JWT access + refresh token model.
- Role-based access control by route permission matrix.
- OTP login flow for patient portal.

## Auditability

Every POST/PUT/DELETE operation is logged in `AuditLog`:
- Tenant ID
- User ID
- Action (HTTP route/method)
- Entity type and entity ID
- Old/new values (JSON)
- IP and user-agent
- Timestamp

## Consent Tracking

`ConsentLog` records:
- User and tenant
- Policy type/version
- Acceptance timestamp
- IP and user-agent

## Regional Data Residency

Region config drives:
- Compliance type
- Tax model and rate
- Currency
- Units system
- S3 storage region
- Report footer compliance tag

Tenant onboarding step 2 auto-applies region defaults and supports manual override.

## Reporting Integrity

- Pathologist/Admin report signing.
- Signature hash persisted as immutable signing record.
- Signed timestamp and signed user captured.
- Delivery channel and delivered timestamp recorded.

## Security Operational Notes

- Keep `ENCRYPTION_KEY`, JWT secrets, Twilio and SMTP credentials in environment variables only.
- Rotate secrets periodically.
- Restrict `/api/internal/results` via network firewall + internal token.
- Store minimal PHI in logs.
- Enable structured SIEM forwarding in production.
