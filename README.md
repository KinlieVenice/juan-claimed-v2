# Project Setup

Stack: React + TS + Tailwind (frontend), Express + TS + Prisma + Postgres (backend), all dockerized.

## Prerequisites

- Docker Desktop installed and running

That's it — no local Node/Postgres install needed.

## First-time setup

```bash
git clone <repo-url>
cd juan-claimed-v2
docker compose up -d --build
```

This starts 3 containers:

| Service  | Port | URL                    |
|----------|------|------------------------|
| frontend | 5173 | http://localhost:5173  |
| backend  | 4000 | http://localhost:4000  |
| postgres | 5432 | localhost:5432          |

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

If you only changed the schema output/generator config (no model changes), regenerate client without a migration:

```bash
docker compose exec backend npx prisma generate
```

Inspect data visually:

```bash
docker compose exec backend npx prisma studio
```
(opens on port 5555 — add `5555:5555` to backend's ports in docker-compose.yml if you want to reach it from host browser)

## Using Prisma in backend code

Import the shared client instance from `backend/src/utils/prisma.ts` — never instantiate `new PrismaClient()` elsewhere (avoids exhausting db connections).

```ts
// backend/src/utils/prisma.ts
import { PrismaClient } from "../generated/prisma";

export const prisma = new PrismaClient();
```

Use it inside a service (`backend/src/services/`):

```ts
// backend/src/services/user.service.ts
import { prisma } from "../utils/prisma";

export const listUsers = () => prisma.user.findMany();

export const createUser = (email: string, name?: string) =>
  prisma.user.create({ data: { email, name } });
```

Call the service from a controller (`backend/src/controllers/`):

```ts
// backend/src/controllers/user.controller.ts
import { Request, Response } from "express";
import { listUsers, createUser } from "../services/user.service";
import { asyncHandler } from "../utils/asyncHandler";

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await listUsers());
});

export const postUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, name } = req.body;
  res.status(201).json(await createUser(email, name));
});
```

Wire up a route (`backend/src/routes/`), then mount it in `backend/src/index.ts`:

```ts
// backend/src/routes/user.routes.ts
import { Router } from "express";
import { getUsers, postUser } from "../controllers/user.controller";

export const userRouter = Router();
userRouter.get("/", getUsers);
userRouter.post("/", postUser);
```

```ts
// backend/src/index.ts
import { userRouter } from "./routes/user.routes";
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

`backend/.env` — copy from `backend/.env.example` if missing. When running via Docker, `docker-compose.yml` env vars override `.env` (points `DATABASE_URL` at the `postgres` service instead of `localhost`).

## Troubleshooting

- Port already in use: another process holds 5173/4000/5432 — stop it or change the port mapping in `docker-compose.yml`.
- Prisma client not found errors: run `docker compose exec backend npx prisma generate`.
- Reset db completely: `docker compose down -v` (deletes postgres volume), then `docker compose up -d --build` and re-run migrations.
