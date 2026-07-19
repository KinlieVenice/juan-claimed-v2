# API Routes

Base URL: `http://localhost:4000` (port from `BACKEND_PORT` env var).

Auth: every protected route runs the `mockAuth` middleware (kept under that name for zero route-file churn, but it's real auth now):
1. `Authorization: Bearer <JWT>` present → verified via `jwt.verify`, current `DimUser` (must have `deletedAt: null` and `active: true`) loaded and set as `req.user`. `401` if invalid/expired/missing user, `403` if deactivated.
2. No `Authorization` header, `NODE_ENV !== "production"` → falls back to the original `x-user-id: <DimUser.id>` header (dev/testing only, same active/deleted checks apply).
3. No `Authorization` header, `NODE_ENV === "production"` → `401` immediately, the mock path can't activate.

Get a token via `POST /api/auth/login` (username+password, AGENT/SUPERADMIN) or `POST /api/auth/google` (Google ID token, USER — auto-creates the account on first login).

**Response envelope — Shape B everywhere now**: `{ success, message, error, errorCode, data }` on both success and error. (Fields/groups controllers have their own bespoke messages/errorCodes per action; benefits/sub-resources/users/scopes share the `handleApiError`/`sendSuccess` helpers in `utils/errorMapping.util.ts` / `utils/apiResponse.util.ts`.)

---

## Health

### `GET /health`
No auth. Response: whatever `getHealthStatus()` returns (raw JSON, not wrapped in the envelope).

---

## Auth — `/api/auth`

### `POST /api/auth/login`
No auth (this issues the token). Body (zod `loginSchema`): `{ username, password }`.

`200` → `data: { token, user }` (`user` has `passHash` stripped). `401` `INVALID_CREDENTIALS` — deliberately generic (wrong username, wrong password, `active: false`, or no `passHash` set — e.g. a USER-role account — all return the exact same message, never revealing which).

### `POST /api/auth/google`
No auth. Body (zod `googleLoginSchema`): `{ idToken }` (a Google ID token from the frontend's Google Identity Services flow).

Verifies the token via `google-auth-library` against `GOOGLE_CLIENT_ID`. If no `DimUser` with that `googleId` exists yet, creates one: `role: "USER"`, `googleId`, `email`, `firstName`/`lastName` from the Google profile, `avatarUrl` from the profile picture, `username` derived from the email local-part (collision-safe — appends `1`, `2`, ... on a taken username), `scopeId`/`groupId`/`psgcCode` all `null`.

`200` → `data: { token, user }`. `401` `INVALID_CREDENTIALS` if the ID token doesn't verify. `403` `FORBIDDEN` if the matched account is deactivated.

### `GET /api/auth/me`
Authenticated (runs through the real `mockAuth` middleware). `200` → `data: <current req.user>` (no `passHash`). Useful for the frontend to rehydrate a session from a stored token.

---

## Fields — `/api/fields`

**No auth middleware on any of these routes** — open to any request, no `x-user-id` needed, no role check. (Pre-existing, out of scope — fields are part 2.)

### `GET /api/fields`
List all. `200` → `data: Field[]`.

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
No auth required. `200` → `data: Group[]`.

### `GET /api/groups/:id`
No auth required. `200` → `data: Group`. `404` `GROUP_NOT_FOUND`.

### `POST /api/groups`
Requires `mockAuth` + `requireRole(MANAGE_GROUPS)` → **SUPERADMIN only**, then `validateBody(createUpdateGroupSchema)`.

Body (`createUpdateGroupSchema`):
```json
{
  "englishName": "string, required",
  "tagalogName": "string, required",
  "englishDescription": "string",
  "tagalogDescription": "string"
}
```
`201` → `data: Group` (note: `createdById` stays `null` — `group.service.ts` doesn't stamp it, per `tofix.md`). `400` `VALIDATION_ERROR` on bad body. `500` on any other error (no specific error-code mapping in this controller beyond zod's).

No edit/delete endpoints exist for groups yet (delete intentionally deferred).

---

## Users — `/api/users`

### `GET /api/users`
`mockAuth` only, any role. `200` → `data: User[]` — **`passHash` stripped**.

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

**Conditions:**
- `role: "USER"` → `password` must be **omitted** (USER logs in via Google, no local password).
- `role: "AGENT" | "SUPERADMIN"` → `password` is **required** (log in with username+password).

**Matrix validation** (shared with `assignUserRole` via `validateRoleConfig`):
| role | scope | groupId | psgcCode |
|---|---|---|---|
| `SUPERADMIN` | must resolve to scope value `SUPERADMIN` | required | must be literal string `"SUPERADMIN"` |
| `AGENT` + scope value `NATIONAL` | — | required | must be `null` |
| `AGENT` + any local scope | — | must be `null` | required |
| `USER` | — | must be `null` | must be `null` |

`201` → `data: User` (**`passHash` never returned**). Errors: `404` `INVALID_SCOPE`; `400` one of `INVALID_SUPERADMIN_CONFIG`/`AGENT_REQUIRES_SCOPE`/`INVALID_NATIONAL_AGENT_CONFIG`/`INVALID_LOCAL_AGENT_CONFIG`/`INVALID_USER_CONFIG`; `409` `DUPLICATE_USER`; `400` zod validation.

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
Same matrix table as create (no password field — only reassigns role/scope/group/location on an existing user).

`200` → `data: User` (no `passHash`, `updatedById` stamped). Errors: `404` `USER_NOT_FOUND` / `INVALID_SCOPE`; `400` matrix violation.

### `PATCH /api/users/:id/active` — activate/deactivate
`mockAuth` + `requireRole(MANAGE_USERS)` → SUPERADMIN only. Body (zod `setUserActiveSchema`): `{ active: boolean }`.

`200` → `data: User`. A deactivated user is rejected at `POST /api/auth/login`/`POST /api/auth/google` (`401`/`403`) and at every other route's auth check (`403`) — this is what actually gates access, checked live, not just at login time. Errors: `404` `USER_NOT_FOUND`.

### `DELETE /api/users/:id` — soft delete
`mockAuth` + `requireRole(MANAGE_USERS)` → SUPERADMIN only. No body. Sets `deletedAt` + `updatedById`.

`200` → `data: { id, deletedAt }`. A deleted user can no longer log in or authenticate via any path (`deletedAt: null` filter applied everywhere). Errors: `404` `USER_NOT_FOUND`.

---

## Scopes — `/api/scopes`

### `GET /api/scopes`
`mockAuth` + `requireRole(PARTICIPATE)` → any authenticated role. No CRUD — fixed seeded set (NATIONAL/REGIONS/PROVINCES/DISTRICTS/CITIES-MUNICIPALITIES/BARANGAYS/SUPERADMIN), intentional.

`200` → `data: DimScope[]` (active only, sorted by `name`). Use `id` for `scopeId` in other requests, `name` for a dropdown label, `value` as the internal scope key.

---

## Benefits — `/api/benefits`

### `GET /api/benefits`
`mockAuth` + `requireRole(PARTICIPATE)` → any authenticated role. `200` → `data: Benefit[]` (active only, `benefitPsgcCodes`/`benefitGroups` included, newest first). No jurisdiction filtering — any authenticated user sees all active benefits.

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
- **Group requirement**: acting user has scope `NATIONAL` or `SUPERADMIN` → at least one group must end up linked. Only a **NATIONAL-scope** agent's own `groupId` is auto-included as `creator: true` — they don't need to repeat it in `groupIds`, only add extra collaborator groups there. **SUPERADMIN never has a `groupId` of their own** (enforced at the seed/account level) and must always supply `groupIds` explicitly in the body — none auto-marked `creator` for SUPERADMIN. The requirement is only violated if the *combined* set (own group, NATIONAL only + body `groupIds`) is empty.
- Every code in `psgcCodes` is looked up against the live PSGC API and boundary-checked against the acting user's own scope/psgcCode — a local-scope user can only submit codes within their own jurisdiction; NATIONAL/SUPERADMIN can submit anything.
- Each code's `scopeId` is resolved from **which PSGC endpoint matched it**, independent of the acting user's own scope — mixed-depth arrays work in a single request.

`201` → `data: Benefit`. Errors:
- `400` `INVALID_INPUT` — missing `psgcCodes` when not nationwide, or combined group set empty for NATIONAL/SUPERADMIN.
- `400` `INVALID_PSGC_CODE` — a code doesn't exist in the PSGC API.
- `403` `FORBIDDEN` — nationwide attempted by non-NATIONAL/SUPERADMIN, or a code outside the user's jurisdiction.
- `500` `SCOPE_NOT_FOUND` — a resolved scope value has no matching `DimScope` row.
- `409` — duplicate `(benefitId, psgcCode)` (Prisma `P2002`).

### `PATCH /api/benefits/:id` — edit (full replace)
`mockAuth` + `requireRole(EDIT_BENEFITS)` → SUPERADMIN or AGENT. Same body/conditions as create — **full replace**: whatever `psgcCodes`/`groupIds` you send become the complete new set (unlisted existing ones soft-deleted, listed ones created or revived). The editor's own `groupId` is auto-included/marked `creator` the same way as create.

Before applying changes, the acting user must be authorized against the benefit's **current** locations too (not just the new ones).

`200` → `data: Benefit`. Errors: same as create, plus `404` `BENEFIT_NOT_FOUND`.

### `DELETE /api/benefits/:id` — soft delete
`mockAuth` + `requireRole(DELETE_BENEFITS)` → SUPERADMIN or AGENT. No body. Same authorization-against-current-locations check as edit.

`200` → `data: { id, deletedAt }`. Cascades `deletedAt`+`updatedById` to the benefit's active `benefitPsgcCodes` and `benefitGroups` rows. Errors: `404` `BENEFIT_NOT_FOUND`.

---

## Benefit Requirements — `/api/benefits/:benefitId/requirements`

Every request first checks the parent benefit exists (`404 BENEFIT_NOT_FOUND`) and the acting user is authorized over it (same rule as edit/delete benefit) — modifying a child row is treated as modifying the benefit.

### `GET /api/benefits/:benefitId/requirements`
`requireRole(PARTICIPATE)`. `200` → `data: Requirement[]` (active only).

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
`201` → `data: Requirement`. `403` `FORBIDDEN`. `404` `BENEFIT_NOT_FOUND`.

### `PATCH /api/benefits/:benefitId/requirements/:id`
`requireRole(EDIT_BENEFIT_REQUIREMENTS)`. Same body as create. `200` → `data: Requirement`. `404` `REQUIREMENT_NOT_FOUND` / `BENEFIT_NOT_FOUND`.

### `DELETE /api/benefits/:benefitId/requirements/:id`
`requireRole(DELETE_BENEFIT_REQUIREMENTS)`. No body. Soft delete. `200` → `data: Requirement` (with `deletedAt` set). `404` `REQUIREMENT_NOT_FOUND` / `BENEFIT_NOT_FOUND`.

---

## Benefit Utilizations — `/api/benefits/:benefitId/utilizations`

Identical shape/rules to Requirements, targeting `FctBenefitUtilization`. Same fields, same permission naming pattern (`CREATE_BENEFIT_UTILIZATIONS`/`EDIT_BENEFIT_UTILIZATIONS`/`DELETE_BENEFIT_UTILIZATIONS`), not-found code `UTILIZATION_NOT_FOUND`.

---

## Benefit Requirement Attachments — `/api/benefits/:benefitId/requirements/:id/attachments`
## Benefit Utilization Attachments — `/api/benefits/:benefitId/utilizations/:id/attachments`

**Attachments hang off a requirement or utilization, never the benefit directly** (per schema design). `entityType` is always `"fct_benefit_requirement"` or `"fct_benefit_utilization"` accordingly, `entityId` is always that requirement/utilization's id — both set server-side, not client input. **Metadata-only** — no file upload handling; client uploads the file elsewhere and registers its metadata here.

Every request checks: the parent benefit exists + acting user authorized over it, **and** the specific requirement/utilization (`:id` in the path) exists, isn't deleted, and belongs to that benefit — 404 with the parent-specific not-found code otherwise.

### `GET .../attachments`
`requireRole(PARTICIPATE)`. `200` → `data: Attachment[]` (active only, `fileSize` as **string**).

### `POST .../attachments`
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

`201` → `data: Attachment`. **Note:** `fileSize` is a `BigInt` column — always serialized as a JSON **string** (e.g. `"204800"`, not `204800`). Errors: `403` `FORBIDDEN`, `404` `BENEFIT_NOT_FOUND` / `REQUIREMENT_NOT_FOUND` / `UTILIZATION_NOT_FOUND`, `400` zod validation.

### `PATCH .../attachments/:attachmentId`
`requireRole(EDIT_BENEFIT_ATTACHMENTS)`. Same body as create. `200` → `data: Attachment`. `404` `ATTACHMENT_NOT_FOUND` / parent not found.

### `DELETE .../attachments/:attachmentId`
`requireRole(DELETE_BENEFIT_ATTACHMENTS)`. No body. Soft delete. `200` → `data: Attachment`. `404` `ATTACHMENT_NOT_FOUND` / parent not found.

---

## Attachment upload token — `/api/attachments/upload-token`

### `POST /api/attachments/upload-token`
`mockAuth` + `requireRole(CREATE_BENEFIT_ATTACHMENTS)` → SUPERADMIN or AGENT. Body is whatever `@vercel/blob/client`'s `upload()` helper sends (a `HandleUploadBody` — not a plain JSON shape you construct by hand, this is called by the Blob client SDK on the frontend, not directly).

Issues a short-lived client upload token via `@vercel/blob`'s `handleUpload` server helper, restricted to the same `ALLOWED_ATTACHMENT_FILE_TYPES` allowlist the attachment CRUD enforces (`image/jpg|jpeg|png|gif|webp`, `application/pdf`, `.doc`/`.docx`), max 25MB. **Requires `BLOB_READ_WRITE_TOKEN` in `.env`** (provision a Blob store in the Vercel dashboard yourself) — without it, `400` `BLOB_TOKEN_ERROR`.

Frontend flow (not built here, backend-only pass): call `upload()` from `@vercel/blob/client` pointed at this endpoint as `handleUploadUrl` → get back a blob URL → `POST` that URL as `filePath` to the existing `.../requirements/:id/attachments` or `.../utilizations/:id/attachments` create endpoint (unchanged, still metadata-only).

---

## Shared error-status mapping (benefits + sub-resources + users + scopes)

| Error message prefix/suffix | HTTP |
|---|---|
| Prisma `P2002` (duplicate) | 409 |
| `*_NOT_FOUND` (except `SCOPE_NOT_FOUND`) | 404 |
| `INVALID_INPUT`, `INVALID_PSGC_CODE` | 400 |
| `SCOPE_NOT_FOUND` | 500 |
| `FORBIDDEN`, `UNAUTHORIZED_SCOPE` | 403 |
| anything else | 500 |
| no/invalid `x-user-id` | 401 (`UNAUTHORIZED`) |

(Fields/groups/users' `assignRoleAndScope`/`createUser` controllers each layer their own bespoke `message`/`errorCode` per action rather than using the shared table verbatim — see each section above.)
