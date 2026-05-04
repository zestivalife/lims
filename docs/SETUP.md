# Installation & Implementation Guide

## 1. Clone/Upload Project

Upload the full `lims-platform` folder to your server.

## 2. Environment Setup

Create `.env` in project root from `.env.example`:

```bash
cd /path/to/lims-platform
cp .env.example .env
```

Update production values:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ENCRYPTION_KEY`
- `TWILIO_*`
- `SMTP_*`
- `AWS_*`
- `INTERNAL_API_TOKEN`

## 3. Start with Docker

```bash
cd /path/to/lims-platform
docker compose -f docker/docker-compose.yml up --build -d
```

## 4. Run DB Seed

```bash
docker compose -f docker/docker-compose.yml exec backend node /seed.js
```

## 5. Verify Services

```bash
docker compose -f docker/docker-compose.yml ps
curl http://localhost:3001/health
```

## 6. Access Application

- Frontend: `http://<server-ip>:3000`
- Backend API: `http://<server-ip>:3001`
- TCP Listener: `tcp://<server-ip>:5000`

## 7. Optional: Reverse Proxy (Nginx)

Route:
- `/` -> frontend `localhost:3000`
- `/api` -> backend `localhost:3001`

Terminate TLS at Nginx and force HTTPS.

## 8. Production Deployment Checklist

- Replace default credentials after first login.
- Restrict database and Redis to private network.
- Enable daily Postgres backups.
- Rotate secrets quarterly.
- Configure S3 lifecycle policy for report retention.
- Configure monitoring and alerting (CPU, memory, DB connections, queue latency).

## 9. Analyzer Integration Test

Mock analyzer service sends HL7 every 15 seconds automatically.

Check live ingestion:

```bash
docker compose -f docker/docker-compose.yml logs -f tcp-listener
docker compose -f docker/docker-compose.yml logs -f backend
```

## 10. CSV Legacy Adapter Test

Drop CSV files into `uploads/incoming` in this format:

```csv
analyzer_id,machine_param,order_id,patient_id,value,unit,reference_range,timestamp
<analyzerId>,GLU,<orderId>,<patientId>,98,mg/dL,70-100,2026-04-23T10:40:00.000Z
```

Processed files move to `uploads/processed`.

## 11. Export as ZIP for Website Upload

From project parent directory:

```bash
cd /path/to
zip -r lims-platform-deploy.zip lims-platform -x \"*/node_modules/*\" -x \"*/.next/*\" -x \"*/dist/*\" -x \"*/.git/*\"
```

This zip includes organized backend/frontend/docker/docs/db schema and seed script.
