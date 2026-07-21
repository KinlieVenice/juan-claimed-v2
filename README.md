# Project Setup

Stack: React + TS + Tailwind (frontend), Express + TS + Prisma + Postgres (backend), all dockerized.

## Prerequisites

- Docker Desktop installed and running

That's it — no local Node/Postgres install needed.

## First-time setup

```bash
git clone <repo-url>
cd Juan Claimed-v2
docker compose up -d --build
```

This starts 4 containers:

| Service      | Port | URL                   |
| ------------ | ---- | --------------------- |
| frontend     | 5175 | http://localhost:5175 |
| landing-page | 5176 | http://localhost:5176 |
| backend      | 4000 | http://localhost:4000 |
| postgres     | 5432 | localhost:5432        |

`landing-page` is a separate Vite/React/bun app (`landing-page/`), copied in from another repo, not part of the main app's build. Its "Explore your benefits" button routes to the main frontend via the `VITE_APP_URL` env var, set in `docker-compose.yml`.

First boot, run migrations to create tables:

```bash
docker compose exec backend npx prisma migrate dev --name init
```

Check backend is alive:

```bash
curl http://localhost:4000/health
```

## Daily use

```bash
docker compose up -d       # start everything
docker compose logs -f backend    # tail backend logs
docker compose logs -f frontend   # tail frontend logs
docker compose down        # stop everything (keeps db data)
```

Source code is bind-mounted into containers — edit files locally, both `tsx watch` (backend) and Vite (frontend) hot-reload automatically. No rebuild needed for code changes, only rebuild when you change `package.json` deps or Dockerfile:

```bash
docker compose up -d --build
```

## Prisma workflow

Schema lives at `backend/prisma/schema.prisma`. Example model:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

Whenever you change `schema.prisma`:

```bash
docker compose exec backend npx prisma migrate dev --name <describe-change>
```

This creates a migration file, applies it to the db, and regenerates the Prisma Client into `backend/src/generated/prisma`.

Note: `backend/src/generated/prisma` is gitignored and lives inside the bind-mounted source tree, so the container's `CMD` runs `npx prisma generate` on every start (see `backend/Dockerfile`) — otherwise a fresh clone on a new machine would mount an empty `src/generated/prisma` over the one baked into the image at build time, and Prisma Client would be missing.

If you only changed the schema output/generator config (no model changes), regenerate client without a migration:

```bash
docker compose exec backend npx prisma generate
```

Inspect data visually:

```bash
docker compose exec -d backend npx prisma studio --port 5555 --browser none
```

`-d` runs it detached so your terminal isn't blocked. `--browser none` avoids a crash (Studio tries to auto-open a browser inside the container, which doesn't exist there). Then open `http://localhost:5555` yourself — already mapped in `docker-compose.yml`.

## Backend is an ESM project

`backend/package.json` has `"type": "module"`. This means:

- Every relative import MUST end in `.js` (even though the source file is `.ts`) — e.g. `from "../utils/prisma.js"`, not `from "../utils/prisma"`. TS resolves it to the right `.ts` file at compile time; this is just Node's ESM resolution rule.
- Type-only imports must use `import type { Foo } from "..."` (e.g. `Request`/`Response` from express) — enforced by `verbatimModuleSyntax` in `tsconfig.json`.
- Forgetting the `.js` extension is the most common mistake here — it compiles fine but fails at runtime with `ERR_MODULE_NOT_FOUND`.

## Using Prisma in backend code

Prisma Client requires a driver adapter now (Prisma 7). Import the shared client instance from `backend/src/utils/prisma.ts` — never instantiate `new PrismaClient()` elsewhere (avoids exhausting db connections).

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

export const createUser = (
  email: string,
  username: string,
  firstName: string,
  lastName: string,
) => prisma.dimUser.create({ data: { email, username, firstName, lastName } });
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

`.env` is gitignored — every dev needs their own copy, it does NOT come from `git clone`.

```bash
cp backend/.env.example backend/.env
```

When running via `docker compose`, the `DATABASE_URL`/`PORT` set in `docker-compose.yml` override `backend/.env` anyway (points at the `postgres` service instead of `localhost`) — but `backend/.env` is still required to exist for commands run outside Docker (e.g. `npx prisma studio` from your host, editor tooling) and because Prisma's config loader errors if the file is missing entirely.

## Troubleshooting

- Port already in use: another process holds 5175/5176/4000/5432 — stop it or change the port mapping in `docker-compose.yml`.
- Prisma client not found errors: regenerates automatically on container start; if still missing, run `docker compose exec backend npx prisma generate`.
- Reset db completely: `docker compose down -v` (deletes postgres volume), then `docker compose up -d --build` and re-run migrations.
