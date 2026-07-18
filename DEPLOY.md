# Deploying to Vercel + Neon

## Overview

- **Frontend** (Vite/React): deploys to Vercel as-is, no changes needed.
- **Backend** (Express): Vercel runs serverless functions, not a persistent server — needs restructuring below.
- **Database**: swap local Postgres for Neon (serverless Postgres, works with Vercel's ephemeral functions).

## Backend changes for Vercel

### 1. Split app from server

Create `backend/src/app.ts` — Express app setup only, no `.listen()`:

```ts
import cors from "cors";
import express from "express";
import { healthRouter } from "./routes/health.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/health", healthRouter);
app.use(errorHandler);

export default app;
```

Keep `backend/src/index.ts` for local dev only — imports `app`, calls `.listen()`.

### 2. Serverless entry point

Create `backend/api/index.ts`:

```ts
import app from "../src/app.js";
export default app;
```

### 3. Vercel routing config

Create `backend/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/api" }]
}
```

### 4. Swap Prisma adapter to Neon

Neon needs its HTTP-based driver for serverless — raw TCP (`@prisma/adapter-pg`) doesn't hold up well across cold starts.

```bash
npm install @prisma/adapter-neon
npm uninstall @prisma/adapter-pg pg
```

Update `backend/src/utils/prisma.ts`:

```ts
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
```

### 5. Env vars on Vercel

Set in Vercel project settings (not committed):

```
DATABASE_URL=<neon-connection-string>
```

Get the connection string from Neon dashboard → your project → Connection Details.

## Cold starts

Vercel spins functions down after a few minutes of no traffic. Next request after that pays a cold-start cost (few hundred ms–2s, depending on bundle size + Prisma engine init). Frequent traffic keeps it warm. Low-traffic/internal APIs feel this more — if that's a problem, consider Railway/Render instead (persistent server, no cold starts).

## Migrations against Neon

Run from your machine, pointed at Neon's connection string (swap `DATABASE_URL` in `backend/.env` temporarily, or pass inline):

```bash
cd backend
npx prisma migrate deploy
```

Use `migrate deploy` (not `migrate dev`) for production — applies existing migrations without prompting or generating new ones.

## Seeding data

Not run automatically by Vercel. Run manually, pointed at Neon:

```bash
cd backend
npx prisma db seed
```

(requires a seed script configured in `package.json` — add if you don't have one yet)

## Modifying data on Neon directly

- **Neon console**: built-in SQL editor in the dashboard — no local setup needed.
- **Prisma Studio**: `npx prisma studio` from your machine, with `DATABASE_URL` pointed at Neon — same tool you use locally, just a different connection string.
