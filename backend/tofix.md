# Known gaps / not yet handled

Schema audit (excluding Field/Hierarchy/RuleGroup/Condition models — that's part 2).

## DimUser — deferred until Google sign-in work

- **`googleId`** — never set or read anywhere. No endpoint links a Google account to a `DimUser` row yet. Needed before Google sign-in can work at all.
- **`avatarUrl`** — never set or read (normally populated from the Google profile on first login).
- **`active`** — never toggled by any endpoint, and `mockAuth` doesn't check it either — a user with `active: false` could still authenticate today. Need to decide: does `active` gate login, or something else (e.g. hide from lists)?
- **`deletedAt`** exists on `DimUser` but there is no delete/deactivate endpoint at all. No way to remove or soft-delete an account today.

Not fixing now — bundling with the Google sign-in task since they're related (`googleId`/`avatarUrl` are populated by that flow, and `active`/delete likely need a real login flow to reason about correctly, e.g. "can't log in" vs "session revoked").

## DimGroup — no delete endpoint

`deletedAt` column exists, `addGroup`/`editGroup` exist (`group.service.ts`), but nothing soft-deletes a group. Explicitly deferred per your instruction — not adding yet.

## DimScope — no CRUD endpoints

Confirmed intentional — fixed seeded set (NATIONAL/REGIONS/PROVINCES/DISTRICTS/CITIES-MUNICIPALITIES/BARANGAYS/SUPERADMIN), not meant to be user-manageable.

## Fixed this session (for reference, not a gap anymore)

- **Attachments were wired to the wrong entity.** Schema comments say attachments belong to a benefit's *requirement* or *utilization*, not the benefit directly. Was: `entityType: "fct_benefit"` / flat `/api/benefits/:benefitId/attachments`. Now: `entityType: "fct_benefit_requirement" | "fct_benefit_utilization"`, nested under `/api/benefits/:benefitId/requirements/:id/attachments` and `.../utilizations/:id/attachments`.
- **`DimBenefitGroup.creator`** now reflects actual ownership: a **NATIONAL-scope** agent's own `groupId` auto-attaches as `creator: true` without needing to repeat it in `groupIds`; any additional `groupIds` in the request body attach as `creator: false` collaborators. **SUPERADMIN never has a `groupId`** (seeder's `userRoleSeeder.ts` now explicitly sets it `null`, including on upsert-update for the already-seeded row — it previously had one from a "Superadmin Group" that was silently auto-attaching) — SUPERADMIN must always supply `groupIds` explicitly, none auto-marked creator.
- **`group.route.ts` double `POST /` registration** — was registered twice; the first-registered handler (auth-gated, no `validateBody`) always won, so the second registration's zod validation never actually ran. Merged into one route (`mockAuth` → `requireRole` → `validateBody` → `createGroup`) — both auth and validation now enforced.

## Still open, not yet scoped

- **Vercel Blob** — attachment endpoints are metadata-only; no actual upload/storage integration yet (deliberate, per earlier decision — separate follow-up once a Blob store is provisioned).
- **`field.routes.ts` has no auth middleware at all** — open to any request. Not in scope (fields are part 2), just noting it's not an oversight from this work.
- **`group.service.ts` doesn't stamp `createdById`/`updatedById`** — `addGroup`/`editGroup` never set them despite the columns existing (same class of gap fixed on benefits earlier). Not fixed — flagging alongside the deferred group-delete item.
