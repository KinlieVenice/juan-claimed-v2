# Project Setup

Stack: React + TS + Tailwind (frontend), Express + TS + Prisma + Postgres (backend).

## Prerequisites

- Node.js 22+ (LTS)
- PostgreSQL 17 installed and running locally (or a remote instance you have a connection string for)

## First-time setup

```bash
git clone <repo-url>
cd juan-claimed-v2
```

### 1. Create the database

```bash
psql -U postgres -c "CREATE DATABASE app;"
```

(adjust user/db name to your local Postgres setup)

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` if your Postgres user/password/port differ from the default:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app?schema=public"
BACKEND_PORT=4000
```

Run migrations (creates tables + generates Prisma Client):

```bash
npx prisma migrate dev
```

Start the dev server:

```bash
npm run dev
```

Check it's alive:

```bash
curl http://localhost:4000/health
```

### 3. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Daily use

```bash
cd backend && npm run dev     # backend, hot-reloads on save (tsx watch)
cd frontend && npm run dev    # frontend, hot-reloads on save (Vite)
```

## Backend is an ESM project

`backend/package.json` has `"type": "module"`. This means:

- Every relative import MUST end in `.js` (even though the source file is `.ts`) — e.g. `from "../utils/prisma.js"`, not `from "../utils/prisma"`. TS resolves it to the right `.ts` file at compile time; this is just Node's ESM resolution rule.
- Type-only imports must use `import type { Foo } from "..."` (e.g. `Request`/`Response` from express) — enforced by `verbatimModuleSyntax` in `tsconfig.json`.
- Forgetting the `.js` extension is the most common mistake here — it compiles fine but fails at runtime with `ERR_MODULE_NOT_FOUND`.

## Prisma workflow

Schema lives at `backend/prisma/schema.prisma`.

Whenever you change `schema.prisma`:

```bash
npx prisma migrate dev --name <describe-change>
```

This creates a migration file, applies it to the db, and regenerates the Prisma Client into `backend/src/generated/prisma`.

If you only changed generator config (no model changes), regenerate client without a migration:

```bash
npx prisma generate
```

Inspect data visually:

```bash
npx prisma studio
```
Opens at `http://localhost:5555`.

## Using Prisma in backend code

Prisma Client requires a driver adapter (Prisma 7). Import the shared client instance from `backend/src/utils/prisma.ts` — never instantiate `new PrismaClient()` elsewhere (avoids exhausting db connections).

```ts
// backend/src/utils/prisma.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
```

Use it inside a service (`backend/src/services/`):

```ts
// backend/src/services/user.service.ts
import { prisma } from "../utils/prisma.js";

export const listUsers = () => prisma.dimUser.findMany();

export const createUser = (email: string, username: string, firstName: string, lastName: string) =>
  prisma.dimUser.create({ data: { email, username, firstName, lastName } });
```

Call the service from a controller (`backend/src/controllers/`):

```ts
// backend/src/controllers/user.controller.ts
import type { Request, Response } from "express";
import { listUsers, createUser } from "../services/user.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await listUsers());
});

export const postUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, firstName, lastName } = req.body;
  res.status(201).json(await createUser(email, username, firstName, lastName));
});
```

Wire up a route (`backend/src/routes/`), then mount it in `backend/src/index.ts`:

```ts
// backend/src/routes/user.routes.ts
import { Router } from "express";
import { getUsers, postUser } from "../controllers/user.controller.js";

export const userRouter = Router();
userRouter.get("/", getUsers);
userRouter.post("/", postUser);
```

```ts
// backend/src/index.ts
import { userRouter } from "./routes/user.routes.js";
app.use("/users", userRouter);
```

Folder convention:

- `routes/` — express Router definitions, maps URL + method to controller
- `controllers/` — reads req, calls service, sends res. No business logic here.
- `services/` — business logic + Prisma calls
- `requests/` — input validation schemas (e.g. zod) per route
- `utils/` — shared helpers (prisma client, asyncHandler, etc.)
- `middlewares/` — express middleware (error handler, auth, etc.)

## Environment variables

`backend/.env` is gitignored — every dev needs their own copy:

```bash
cp backend/.env.example backend/.env
```

## Troubleshooting

- `ECONNREFUSED` connecting to db: Postgres isn't running, or `DATABASE_URL` in `.env` doesn't match your local user/password/port.
- Port already in use: another process holds 5173/4000/5555 — stop it or change the port in `.env` / `vite.config.ts`.
- Prisma client not found errors: run `npx prisma generate` inside `backend/`.
- Reset db: `DROP DATABASE app; CREATE DATABASE app;` in psql, then `npx prisma migrate dev` again.
