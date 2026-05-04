# Deployment Guide

## Docker (Recommended)
1. Copy `.env.example` to `.env` and set secrets.
2. Run:
   - `docker compose up --build -d`
3. Apply seed (optional):
   - `docker compose exec backend node /seed.js`

## Manual Deployment
### Backend
1. `cd backend`
2. `npm install`
3. `npm run prisma:generate`
4. `npm run prisma:push`
5. `npm run start`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run build`
4. `npm run start`

## Reverse Proxy
Use Nginx/Caddy to expose:
- Frontend: port `3000`
- Backend API: port `3001`
- TCP Listener: port `5000` (internal or firewall-restricted)
