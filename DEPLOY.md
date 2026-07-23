# Deploying to Vercel + Neon

Two Vercel projects from this one repo: **frontend** and **backend**, each with its own
Root Directory setting. `landing-page/` is not deployed — its content already lives in
`frontend/src/pages/public/*`.

## What's already in place

- `frontend/vercel.json` — SPA fallback rewrite (every path serves `index.html`, so
  client-side routes like `/my-benefits` don't 404 on a hard refresh or deep link).
- `backend/src/app.ts` — the Express app itself (middleware + routes), no `.listen()`.
- `backend/src/index.ts` — local-dev-only entrypoint (Docker Compose's `tsx watch` target):
  imports `app.ts` and calls `.listen()`. Vercel never runs this file.
- `backend/api/index.ts` — the Vercel serverless entrypoint: imports and exports `app.ts`
  directly. Any file under `backend/api/` becomes a function; Vercel's Node runtime knows
  how to invoke an exported Express app as the request handler.
- `backend/vercel.json` — rewrites every request to that one function.
- File uploads already go through `@vercel/blob` client-direct upload
  (`attachmentUpload.controller.ts`) — no code change needed, just the env var below.

## 1. Database — Neon

1. Create a Neon project (or any hosted Postgres — Neon is just the one these docs assume).
2. Use the **pooled** connection string (the one with `-pooler` in the hostname), not the
   direct one, for `DATABASE_URL` — serverless functions open/close connections far more
   often than a persistent server, and the pooler is what keeps that from exhausting
   Postgres's connection limit. The backend keeps using `@prisma/adapter-pg` (unchanged from
   local dev) — the pooled connection string alone is enough for Vercel; swapping to
   `@prisma/adapter-neon` is a further option later if cold-start latency ever becomes a
   real problem, not required to ship.
3. Run migrations against it before the first deploy:
   ```bash
   cd backend
   DATABASE_URL="<neon-pooled-connection-string>" npx prisma migrate deploy
   ```
   (`migrate deploy`, not `migrate dev` — applies existing migrations without prompting or
   generating new ones.)
4. Seed it the same way, once, after migrations:
   ```bash
   DATABASE_URL="<neon-pooled-connection-string>" npx prisma db seed
   ```

## 2. Deploy the backend

1. New Vercel project → import this repo → set **Root Directory** to `backend`.
2. Framework preset: Other (Vercel auto-detects the `api/` folder either way).
3. Build command / output: leave default — there's nothing to statically build; Vercel
   compiles `api/index.ts` into a function on its own.
4. Env vars (Project Settings → Environment Variables) — everything currently in the root
   `.env` except the local-only ones:

   | Var | Notes |
   |---|---|
   | `DATABASE_URL` | Neon **pooled** connection string |
   | `JWT_SECRET` | same value as local, or rotate for production |
   | `GOOGLE_CLIENT_ID` | same as local |
   | `BLOB_READ_WRITE_TOKEN` | **don't set by hand** — appears automatically once you link a Blob store to this project (Storage tab → Create → Blob) |
   | `UNLOCK_GOOGLE_SYNCED_FIELDS` | `"false"` in production (demo-only escape hatch) |
   | `PRESET_USERNAME` / `PRESET_PASSWORD` | omit entirely in production (demo-only form prefill) |
   | `EGOV_BASE_URL`, `EGOV_PARTNER_CODE`, `EGOV_PARTNER_SECRET` | eGov SSO |
   | `EGOV_EVERIFY_CLIENT_ID`, `EGOV_EVERIFY_CLIENT_SECRET`, `EGOV_EVERIFY_PUBKEY` | eVerify |
   | `EGOV_EMESSAGE_ACCESS_TOKEN`, `EGOV_MESSAGE_BASE_URL` | eMessage (SMS push) |
   | `EGOV_AI_ACCESS_CODE`, `EGOV_AI_CORE_BASE_URL` | AI Core (translator) |
   | `EGOV_PAY_API_KEY`, `EGOV_PAY_SETTLEMENT_TEMPLATE_UUID` | eGovPay |
   | `EGOV_REPORT_ACCESS_TOKEN` | eReport |
   | `EGOV_FACE_LIVENESS_API_KEY` | Face Liveness |
   | `EGOV_COMPASS_API_KEY` | Compass |

   `BACKEND_PORT` is not needed — Vercel controls the port a function listens on, and
   `index.ts` (the only file that reads it) never runs there.

5. Deploy. Note the resulting URL (e.g. `https://your-backend.vercel.app`) — the frontend
   needs it next.

## 3. Deploy the frontend

1. New Vercel project → import this repo again → set **Root Directory** to `frontend`.
2. Framework preset: Vite (auto-detected — build command `npm run build`, output `dist`).
3. Env vars:

   | Var | Value |
   |---|---|
   | `VITE_API_BASE_URL` | the backend's deployed URL from step 2 (e.g. `https://your-backend.vercel.app`) — see `lib/api.ts`, falls back to `http://localhost:4000` when unset |
   | `VITE_GOOGLE_CLIENT_ID` | same `GOOGLE_CLIENT_ID` value as the backend |
   | `VITE_UNLOCK_GOOGLE_SYNCED_FIELDS` | `"false"` in production |
   | `VITE_PRESET_USERNAME` / `VITE_PRESET_PASSWORD` | omit in production |

4. Deploy.

## 4. Manual follow-ups after both are live

- **Google OAuth**: add the deployed frontend origin (e.g. `https://your-frontend.vercel.app`)
  to the OAuth client's Authorized JavaScript origins in Google Cloud Console — Google
  rejects the sign-in flow from an origin it doesn't recognize.
- **eGov SSO**: same idea, if/when a real redirect callback URL gets registered with eGov
  (today's exchange-code flow is a manual paste-in, so this isn't blocking).
- **CORS**: the backend currently allows every origin (`app.use(cors())`, no allowlist) —
  fine for now, worth tightening to the frontend's real domain once both are live.

## Cold starts

Vercel spins functions down after a few minutes of no traffic; the next request pays a
cold-start cost (a few hundred ms–2s, mostly Prisma engine init). Frequent traffic keeps it
warm. If this becomes a real problem for a low-traffic deployment, Railway/Render (a
persistent server, no cold starts) is the usual next step — not needed to ship.

## Modifying data on Neon directly

- **Neon console**: built-in SQL editor in the dashboard, no local setup needed.
- **Prisma Studio**: `npx prisma studio` from your machine with `DATABASE_URL` pointed at
  Neon's pooled connection string — same tool as local, different connection string.
