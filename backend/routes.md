# API Routes

Base URL: `http://localhost:4000` (port from `BACKEND_PORT` env var).

Auth: mock auth via `mockAuth` middleware — every protected route requires header `x-user-id: <DimUser.id>`. No `x-user-id` or unknown id → `401`.

Response envelope is not fully consistent across the codebase (two shapes exist, both are used as-is below):
- **Shape A** (benefits + sub-resources): `{ success, data }` on success, `{ success, message }` on error.
- **Shape B** (health/fields/groups/users): `{ success, message, error, errorCode, data }` on both success and error.

---

## Health

### `GET /health`
No auth. Response: whatever `getHealthStatus()` returns (raw JSON, not wrapped).

---

## Fields — `/api/fields`

**No auth middleware on any of these routes** — open to any request, no `x-user-id` needed, no role check. (Pre-existing, not part of the benefit/user work.)

### `GET /api/fields`
List all. `200`, Shape B, `data: Field[]`.

### `GET /api/fields/:id`
`200` → `data: Field`. `404` `FIELD_NOT_FOUND` if missing.

### `POST /api/fields`
Body (zod `createUpdateFieldSchema`):
```json
{
  "key": "string, required",
  "englishName": "string, required",
  "tagalogName": "string, required",
  "description": "string",
  "classification": "GLOBAL | FOLLOW_UP",
  "default": true,
  "required": true,
  "sortOrder": 0,
  "configJson": { "any": "json" } | null,
  "fieldInputTypeId": "string, required",
  "parentFieldId": "string | null",
  "fieldHierarchyId": "string | null"
}
```
`201` → `data: Field`. `409` `DUPLICATE_KEY` if `key` taken. `400` `INVALID_FOREIGN_KEY` if `fieldInputTypeId`/`parentFieldId`/`fieldHierarchyId` don't exist.

### `PUT /api/fields/:id`
Same body as create. `200` → `data: Field`. `404` `FIELD_NOT_FOUND`. `400` `INVALID_FOREIGN_KEY`.

### `DELETE /api/fields/:id`
No body. `200` → `data: { id }`. `404` `FIELD_NOT_FOUND`.

---

## Groups — `/api/groups`

### `GET /api/groups`
No auth required. `200`, Shape B, `data: Group[]`.

### `GET /api/groups/:id`
No auth required. `200` → `data: Group`. `404` `GROUP_NOT_FOUND`.

### `POST /api/groups`
Requires `mockAuth` + `requireRole(MANAGE_GROUPS)` → **SUPERADMIN only**.

> **Known bug**: this route is registered twice in `group.route.ts` (once with auth, once with `validateBody`). Express uses the *first* match, so the currently-active handler is the auth-gated one **without** zod validation actually applied — the body below is the intended shape but isn't enforced by a validator at runtime yet.

Body (intended, `createUpdateGroupSchema`):
```json
{
  "englishName": "string, required",
  "tagalogName": "string, required",
  "englishDescription": "string",
  "tagalogDescription": "string"
}
```
`201` → `data: Group`. `500` on any error (no specific error-code mapping in this controller yet).

No edit/delete endpoints exist for groups yet.

---

## Users — `/api/users`

### `GET /api/users`
`mockAuth` only, any role. `200`, Shape B, `data: User[]` — **`passHash` stripped**.

### `GET /api/users/:id`
`mockAuth` only. `200` → `data: User` (no `passHash`). `404` `USER_NOT_FOUND`.

### `POST /api/users` — create account
`mockAuth` + `requireRole(MANAGE_USERS)` → **SUPERADMIN only**.

Body (zod `createUserSchema`):
```json
{
  "username": "string, required",
  "email": "valid email, required",
  "firstName": "string, required",
  "middleName": "string, optional",
  "lastName": "string, required",
  "role": "SUPERADMIN | AGENT | USER",
  "scopeId": "string | null, optional",
  "groupId": "string | null, optional",
  "psgcCode": "string | null, optional",
  "password": "string, min 8 chars — required unless role is USER"
}
```

**Conditions** (`password` requirement, enforced by zod refine before the matrix even runs):
- `role: "USER"` → `password` must be **omitted** (USER logs in via Google, no local password).
- `role: "AGENT" | "SUPERADMIN"` → `password` is **required** (these log in with username+password).

**Matrix validation** (same rules `assignUserRole` enforces, shared via `validateRoleConfig`):
| role | scope | groupId | psgcCode |
|---|---|---|---|
| `SUPERADMIN` | must resolve to scope value `SUPERADMIN` | required | must be literal string `"SUPERADMIN"` |
| `AGENT` + scope value `NATIONAL` | — | required | must be `null` |
| `AGENT` + any local scope (REGIONS/PROVINCES/DISTRICTS/CITIES-MUNICIPALITIES/BARANGAYS) | — | must be `null` | required |
| `USER` | — | must be `null` | must be `null` |

`201` → `data: User` (**`passHash` never returned**). Errors:
- `404` `INVALID_SCOPE` — `scopeId` doesn't exist.
- `400` `INVALID_SUPERADMIN_CONFIG` / `AGENT_REQUIRES_SCOPE` / `INVALID_NATIONAL_AGENT_CONFIG` / `INVALID_LOCAL_AGENT_CONFIG` / `INVALID_USER_CONFIG` — matrix violation.
- `409` `DUPLICATE_USER` — `username` or `email` already taken.
- `400` (zod) if `password` condition above is violated, or any field fails basic validation.

### `PATCH /api/users/:id/role` — reassign role/scope/group/psgcCode
`mockAuth` + `requireRole(MANAGE_USERS)` → **SUPERADMIN only**.

Body (zod `assignRoleSchema`):
```json
{
  "role": "SUPERADMIN | AGENT | USER",
  "scopeId": "string | null, optional",
  "groupId": "string | null, optional",
  "psgcCode": "string | null, optional"
}
```
Same matrix table as above (no password field here — this only reassigns role/scope/group/location on an *existing* user, doesn't touch credentials).

`200` → `data: User` (no `passHash`). Errors:
- `404` `USER_NOT_FOUND` / `INVALID_SCOPE`.
- `400` matrix violation (same 5 error codes as create).

---

## Benefits — `/api/benefits`

### `GET /api/benefits`
`mockAuth` + `requireRole(PARTICIPATE)` → any authenticated role. `200`, Shape A, `data: Benefit[]` (active only, `benefitPsgcCodes`/`benefitGroups` included, newest first). No jurisdiction filtering — any authenticated user sees all active benefits.

### `GET /api/benefits/:id`
Same auth. `200` → `data: Benefit` (with `locationName` enriched per PSGC code). `404` `BENEFIT_NOT_FOUND`.

### `POST /api/benefits` — create
`mockAuth` + `requireRole(CREATE_BENEFITS)` → SUPERADMIN or AGENT.

Body (zod `createBenefitSchema`):
```json
{
  "name": "string, required",
  "englishDescription": "string",
  "tagalogDescription": "string",
  "nationwide": false,
  "psgcCodes": ["042114000"],
  "groupIds": ["uuid"]
}
```

**Conditions:**
- `nationwide: true` → only users with scope `NATIONAL` or `SUPERADMIN` may set this. `psgcCodes` is ignored/not required. No `DimBenefitPsgcCode` rows are created.
- `nationwide` not `true` (default `false`) → `psgcCodes` must have at least 1 entry.
- Acting user has scope `NATIONAL` or `SUPERADMIN` → `groupIds` must have at least 1 entry (regardless of `nationwide`).
- Every code in `psgcCodes` is looked up against the live PSGC API (`https://psgc.gitlab.io/api`) and boundary-checked against the acting user's own scope/psgcCode — a local-scope user (REGIONS/PROVINCES/DISTRICTS/CITIES-MUNICIPALITIES/BARANGAYS) can only submit codes within their own jurisdiction; NATIONAL/SUPERADMIN can submit anything.
- Each code's `scopeId` (stored on `DimBenefitPsgcCode`) is resolved from **which PSGC endpoint matched it** (barangay/city-muni/province/district/region), independent of the acting user's own scope — mixed-depth arrays (e.g. one whole region + a couple of provinces from a different region) work in a single request.

`201` → `data: Benefit` (`isNationwide`, `benefitPsgcCodes[].locationName`, `benefitGroups[].group` included). Errors:
- `400` `INVALID_INPUT` — missing `psgcCodes` when not nationwide, or NATIONAL/SUPERADMIN missing `groupIds`.
- `400` `INVALID_PSGC_CODE` — a code doesn't exist in the PSGC API.
- `403` `FORBIDDEN` — nationwide attempted by non-NATIONAL/SUPERADMIN, or a code outside the user's jurisdiction.
- `500` `SCOPE_NOT_FOUND` — a resolved scope value has no matching `DimScope` row (shouldn't happen with a seeded DB).
- `409` — duplicate `(benefitId, psgcCode)` (Prisma `P2002`).

### `PATCH /api/benefits/:id` — edit (full replace)
`mockAuth` + `requireRole(EDIT_BENEFITS)` → SUPERADMIN or AGENT. Same body/conditions as create — this is a **full replace**, not a partial patch: whatever `psgcCodes`/`groupIds` you send become the complete new set (unlisted existing ones are soft-deleted, listed ones are created or revived).

Before applying changes, the acting user must be authorized against the benefit's **current** locations too (not just the new ones) — same rule as nationwide-only-NATIONAL/SUPERADMIN, or per-code boundary check against every currently-active `benefitPsgcCodes` row.

`200` → `data: Benefit`. Errors: same as create, plus `404` `BENEFIT_NOT_FOUND` (missing or already soft-deleted).

### `DELETE /api/benefits/:id` — soft delete
`mockAuth` + `requireRole(DELETE_BENEFITS)` → SUPERADMIN or AGENT. No body. Same authorization-against-current-locations check as edit.

`200` → `data: { id, deletedAt }`. Cascades `deletedAt`+`updatedById` to the benefit's active `benefitPsgcCodes` and `benefitGroups` rows too. Errors: `404` `BENEFIT_NOT_FOUND`.

---

## Benefit Requirements — `/api/benefits/:benefitId/requirements`

Every request here first checks the parent benefit exists (`404 BENEFIT_NOT_FOUND`) and that the acting user is authorized over it (same rule as edit/delete benefit above) — modifying a child row is treated as modifying the benefit.

### `GET /api/benefits/:benefitId/requirements`
`requireRole(PARTICIPATE)` → any authenticated role. `200` → `data: Requirement[]` (active only).

### `POST /api/benefits/:benefitId/requirements`
`requireRole(CREATE_BENEFIT_REQUIREMENTS)` → SUPERADMIN or AGENT.

Body (zod `benefitRequirementSchema`):
```json
{
  "englishName": "string, required",
  "tagalogName": "string, required",
  "englishDescription": "string, required",
  "tagalogDescription": "string, required"
}
```
`201` → `data: Requirement`. `403` `FORBIDDEN` if user not authorized over parent benefit. `404` `BENEFIT_NOT_FOUND`.

### `PATCH /api/benefits/:benefitId/requirements/:id`
`requireRole(EDIT_BENEFIT_REQUIREMENTS)` → SUPERADMIN or AGENT. Same body as create. `200` → `data: Requirement`. `404` `REQUIREMENT_NOT_FOUND` (wrong id or already deleted) / `BENEFIT_NOT_FOUND`.

### `DELETE /api/benefits/:benefitId/requirements/:id`
`requireRole(DELETE_BENEFIT_REQUIREMENTS)` → SUPERADMIN or AGENT. No body. Soft delete. `200` → `data: Requirement` (with `deletedAt` set). `404` `REQUIREMENT_NOT_FOUND` / `BENEFIT_NOT_FOUND`.

---

## Benefit Utilizations — `/api/benefits/:benefitId/utilizations`

Identical shape/rules to Requirements, targeting `FctBenefitUtilization` instead. Same body fields (`englishName`/`tagalogName`/`englishDescription`/`tagalogDescription`), same permissions naming pattern (`CREATE_BENEFIT_UTILIZATIONS`/`EDIT_BENEFIT_UTILIZATIONS`/`DELETE_BENEFIT_UTILIZATIONS`), same not-found code (`UTILIZATION_NOT_FOUND`).

---

## Benefit Attachments — `/api/benefits/:benefitId/attachments`

**Metadata-only** — no file upload handling in this API. Client uploads the file elsewhere (e.g. a storage bucket) and registers its metadata here. `entityType` is always `"fct_benefit"`, `entityId` is always the benefit's id (both set server-side, not client input).

Same parent-benefit existence/authorization check as requirements/utilizations.

### `GET /api/benefits/:benefitId/attachments`
`requireRole(PARTICIPATE)`. `200` → `data: Attachment[]` (active only, `fileSize` as **string**, see note below).

### `POST /api/benefits/:benefitId/attachments`
`requireRole(CREATE_BENEFIT_ATTACHMENTS)` → SUPERADMIN or AGENT.

Body (zod `benefitAttachmentSchema`):
```json
{
  "fileLabel": "string, required",
  "fileName": "string, required",
  "fileType": "one of the allowed mime types below, required",
  "filePath": "string, required (URL or storage path)",
  "fileSize": 204800,
  "metaData": { "any": "json" }
}
```

**Allowed `fileType` values** (anything else → `400` zod validation error):
- `image/jpg`, `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- `application/pdf`
- `application/msword` (`.doc`)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (`.docx`)

`201` → `data: Attachment`. **Note:** `fileSize` is a `BigInt` column — the response always serializes it as a **JSON string** (e.g. `"204800"`, not `204800`), since raw BigInt can't survive `JSON.stringify`. Errors: `403` `FORBIDDEN`, `404` `BENEFIT_NOT_FOUND`, `400` zod validation (bad `fileType`, missing field, negative/non-integer `fileSize`).

### `PATCH /api/benefits/:benefitId/attachments/:id`
`requireRole(EDIT_BENEFIT_ATTACHMENTS)`. Same body as create. `200` → `data: Attachment`. `404` `ATTACHMENT_NOT_FOUND` / `BENEFIT_NOT_FOUND`.

### `DELETE /api/benefits/:benefitId/attachments/:id`
`requireRole(DELETE_BENEFIT_ATTACHMENTS)`. No body. Soft delete. `200` → `data: Attachment`. `404` `ATTACHMENT_NOT_FOUND` / `BENEFIT_NOT_FOUND`.

---

## Shared error-status mapping (benefits + sub-resources only)

| Error message prefix/suffix | HTTP |
|---|---|
| Prisma `P2002` (duplicate) | 409 |
| `*_NOT_FOUND` (except `SCOPE_NOT_FOUND`) | 404 |
| `INVALID_INPUT`, `INVALID_PSGC_CODE` | 400 |
| `SCOPE_NOT_FOUND` | 500 |
| `FORBIDDEN`, `UNAUTHORIZED_SCOPE` | 403 |
| anything else | 500 |
| no/invalid `x-user-id` | 401 |

(Fields/groups/users controllers each have their own bespoke error mapping — see each section above; they don't use this shared table.)
