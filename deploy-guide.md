# Deploy Guide — Vercel (free tier) + Neon

Three Vercel projects: `frontend`, `landing-page`, `backend`. DB on Neon (Postgres).

## Backend

Stack: Express 5 + Prisma + `pg`. No websockets/cron found — fits serverless.

1. Backend doesn't run `app.listen()` on Vercel. Add a serverless entrypoint:
   - `backend/api/index.ts` exporting the Express app (via `@vercel/node` or `serverless-http`).
   - Add `backend/vercel.json` routing all requests to that function.
2. DB connections: Prisma + serverless functions can cause connection storms with a plain `pg` Pool per invocation.
   - Use Neon's **pooled** connection string (`-pooler` host) for `DATABASE_URL`, or
   - Swap to `@prisma/adapter-neon` (websocket/HTTP driver built for serverless) instead of `@prisma/adapter-pg`.
3. File uploads already on `@vercel/blob` — no change needed.
4. Free tier limits to know:
   - 10s max execution per function
   - 100GB bandwidth/mo
   - 100 GB-hrs function execution/mo
   - No cron jobs on free tier (add later if any scheduled job shows up)
5. Env vars to set in Vercel project settings: `DATABASE_URL` (Neon pooled URL), JWT secret, Google OAuth creds, `@vercel/blob` token, etc — whatever's currently in `backend/.env`.

## Frontend + landing-page

Both are static Vite SPAs — deploy as-is on Vercel free tier, no changes needed.

- `landing-page`: set `VITE_APP_URL` env var in Vercel project settings to the deployed frontend URL (replaces the docker-compose localhost value).
- `frontend`: point its API base URL env var to the deployed backend URL.

## DB — Neon

- Create Neon project, use the **pooled connection string** (not direct) as `DATABASE_URL` for the backend.
- Run `prisma migrate deploy` (not `migrate dev`) against Neon before first deploy.

## Order of operations when ready

1. Neon DB up, run migrations.
2. Deploy backend, set env vars, verify API responds.
3. Deploy frontend, point at backend URL.
4. Deploy landing-page, point `VITE_APP_URL` at frontend URL.
