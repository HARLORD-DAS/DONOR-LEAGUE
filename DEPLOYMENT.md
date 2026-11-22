# DONOR LEAGUE deployment

## Architecture

- **Frontend:** Next.js hosted on Vercel from the `frontend/` root directory.
- **API:** FastAPI hosted as a separate Python web service on Render from `backend/`.
- **Database:** Persistent managed PostgreSQL on Render. Do not use SQLite or `/tmp` for production user accounts.

## 1. Deploy the API and database

1. In Render, create a Blueprint from this repository and review `render.yaml`.
2. The blueprint provisions a Render web service and a managed PostgreSQL database. Review the plan and pricing before confirming.
3. Set `FRONTEND_ORIGIN` and `APP_BASE_URL` to the Vercel domain you will use (for example, `https://your-project.vercel.app`).
4. Keep `SEED_DEMO_DATA=false` for production. The repository contains sample demo identities and public test passwords; do not seed these into a public production database.
5. Wait for the API health check to pass at `https://YOUR-API.onrender.com/api/v1/health`.

## 2. Deploy the frontend

1. Import `HARLORD-DAS/DONOR-LEAGUE` into Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework: **Next.js**. Build command: `npm run build`.
4. Add this environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://YOUR-API.onrender.com/api/v1`
5. Deploy. Redeploy whenever this environment variable changes.

## 3. Required production checks

- Test a new signup, verify it reaches role selection only after the authenticated profile is loaded, and complete each role's profile.
- Sign out and sign back in. A completed donor must reach `/donor/dashboard`; a completed attender must reach `/attendant/dashboard`; an account with no saved role must reach `/select-role`.
- Confirm user records persist after backend redeploy/restart.
- Confirm donor search, OpenStreetMap geocoding, request matching, and donor availability updates.
- WhatsApp and SMS are simulation-only until valid provider credentials, approved templates, and consent flows are configured.

## Important

The Vercel project hosts the Next.js frontend only. The FastAPI API must be running at the separately configured `NEXT_PUBLIC_API_URL`. The OpenStreetMap MCP is a development-agent integration; the deployed app uses its configured OSM-compatible HTTP services.

Never commit real API tokens, database passwords, or production secrets to Git.
