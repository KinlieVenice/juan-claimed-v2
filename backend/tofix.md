# Known gaps / not yet handled

Schema audit (excluding Field/Hierarchy/RuleGroup/Condition models — that's part 2).

## DimGroup — no delete endpoint

`deletedAt` column exists, `addGroup`/`editGroup` exist (`group.service.ts`), but nothing soft-deletes a group. Explicitly deferred per your instruction — not adding yet.

## DimScope — no CRUD endpoints

Confirmed intentional — fixed seeded set (NATIONAL/REGIONS/PROVINCES/DISTRICTS/CITIES-MUNICIPALITIES/BARANGAYS/SUPERADMIN), not meant to be user-manageable.

## Fixed this session (for reference, not a gap anymore)

- **Attachments were wired to the wrong entity.** Schema comments say attachments belong to a benefit's *requirement* or *utilization*, not the benefit directly. Was: `entityType: "fct_benefit"` / flat `/api/benefits/:benefitId/attachments`. Now: `entityType: "fct_benefit_requirement" | "fct_benefit_utilization"`, nested under `/api/benefits/:benefitId/requirements/:id/attachments` and `.../utilizations/:id/attachments`.
- **`DimBenefitGroup.creator`** now reflects actual ownership: a **NATIONAL-scope** agent's own `groupId` auto-attaches as `creator: true` without needing to repeat it in `groupIds`; any additional `groupIds` in the request body attach as `creator: false` collaborators. **SUPERADMIN never has a `groupId`** (seeder's `userRoleSeeder.ts` now explicitly sets it `null`, including on upsert-update for the already-seeded row — it previously had one from a "Superadmin Group" that was silently auto-attaching) — SUPERADMIN must always supply `groupIds` explicitly, none auto-marked creator.
- **`group.route.ts` double `POST /` registration** — was registered twice; the first-registered handler (auth-gated, no `validateBody`) always won, so the second registration's zod validation never actually ran. Merged into one route (`mockAuth` → `requireRole` → `validateBody` → `createGroup`) — both auth and validation now enforced.
- **`googleId`/`avatarUrl`/`active`/`DimUser.deletedAt` — all closed.** `POST /api/auth/google` verifies a Google ID token (`google-auth-library`), creates the `DimUser` row on first login (role `USER`, `googleId`, `avatarUrl` from the profile, username derived from the email local-part with collision handling) or logs in the existing one. `POST /api/auth/login` does username+password for AGENT/SUPERADMIN. Both routes, plus the dev-only `x-user-id` fallback, now check `active` and reject with `403`/`401` if the account is deactivated or soft-deleted. `PATCH /api/users/:id/active` and `DELETE /api/users/:id` (both SUPERADMIN-only) added to actually manage those states.
- **Real auth wired in** — `mockAuth.middleware.ts` (kept under that name so no route file needed changes) now checks `Authorization: Bearer <JWT>` first; only falls back to the mock `x-user-id` header when no bearer token is present **and** `NODE_ENV !== "production"`. In production, `x-user-id` alone is rejected with `401`.
- **Vercel Blob client-upload-token endpoint** — `POST /api/attachments/upload-token` (auth + `CREATE_BENEFIT_ATTACHMENTS` role required) issues a short-lived client upload token via `@vercel/blob/client`'s `handleUpload`, validated against the same `ALLOWED_ATTACHMENT_FILE_TYPES` allowlist the attachment CRUD already enforces. The existing attachment create/edit endpoints are unchanged — still metadata-only, now typically fed a real Blob URL. **You still need to provision a Blob store in the Vercel dashboard and set `BLOB_READ_WRITE_TOKEN` in `.env`** — without it the endpoint returns a clean `400 BLOB_TOKEN_ERROR`, verified.

## Still open, not yet scoped

- **`field.routes.ts` has no auth middleware at all** — open to any request. Not in scope (fields are part 2), just noting it's not an oversight from this work.
- **`group.service.ts` doesn't stamp `createdById`/`updatedById`** — `addGroup`/`editGroup` never set them despite the columns existing (same class of gap fixed on benefits earlier). Not fixed — flagging alongside the deferred group-delete item.
- **No refresh-token flow** — a single 7-day JWT (`signAuthToken`), simplest reasonable default for this scope. If a shorter-lived token + refresh flow is ever wanted, that's a separate task.
- **Google sign-in not yet exercised end-to-end with a real browser-obtained ID token** — verified `loginWithGoogle`'s logic (payload handling, username collision) via direct calls, but full E2E needs the frontend's Google Identity Services button, which doesn't exist yet.
