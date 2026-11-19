# APMC Yard Digital — MERN migration starter

This is the first MERN migration foundation for APMC Yard Digital. The existing legacy website remains untouched in the repository root.

## Stack
- React + Vite frontend
- Node.js + Express API
- MongoDB + Mongoose models
- JWT authentication foundation
- Role-based authorization middleware

## Run locally
Requirements: Node.js 20+ and MongoDB.

1. Copy `.env.example` to `server/.env`.
2. Set `MONGODB_URI`, `JWT_SECRET` and `CLIENT_ORIGIN`.
3. From `mern/`, run `npm install`.
4. Run `npm run dev`.
5. Open http://localhost:5173.

## API foundation
- GET /api/health
- POST /api/auth/login
- GET /api/auth/me
- GET/POST /api/lots
- GET/POST /api/gate-entries

## Migration status
This is a scaffold, not a finished migration. Existing HTML/CSS/JS workflows are not yet fully ported. Auction, weighment, sales, farmer payments, trader ledger, buyer dues, disputes, reports, audit trail and mobile flows still need migration and end-to-end validation.

Do not commit real credentials. Provision the first administrator through a secure one-time process before production use.
