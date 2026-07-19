# API Routes

Base URL: `http://localhost:4000` (port from `BACKEND_PORT` env var).

Auth: every protected route runs the `mockAuth` middleware (kept under that name for zero route-file churn, but it's real auth now):
1. `Authorization: Bearer <JWT>` present → verified via `jwt.verify`, current `DimUser` (must have `deletedAt: null` and `active: true`) loaded and set as `req.user`. `401` if invalid/expired/missing user, `403` if deactivated.
2. No `Authorization` header, `NODE_ENV !== "production"` → falls back to the original `x-user-id: <DimUser.id>` header (dev/testing only, same active/deleted checks apply).
3. No `Authorization` header, `NODE_ENV === "production"` → `401` immediately, the mock path can't activate.

Get a token via `POST /api/auth/login` (username+password, AGENT/SUPERADMIN) or `POST /api/auth/google` (Google ID token, USER — auto-creates the account on first login).

**Response envelope — Shape B everywhere now**: `{ success, message, error, errorCode, data }` on both success and error. (Groups controller has its own bespoke messages/errorCodes per action; benefits/sub-resources/users/scopes share the `handleApiError`/`sendSuccess` helpers in `utils/errorMapping.util.ts` / `utils/apiResponse.util.ts`.)

---

## Health

### `GET /health`
No auth. Response: whatever `getHealthStatus()` returns (raw JSON, not wrapped in the envelope).

---

## Auth — `/api/auth`

### `POST /api/auth/login`
No auth (this issues the token). Body (zod `loginSchema`): `{ username, password }`.

`200` → `data: { token, user }` (`user` has `passHash` stripped). `401` `INVALID_CREDENTIALS` — deliberately generic (wrong username, wrong password, `active: false`, or no `passHash` set — e.g. a USER-role account — all return the exact same message, never revealing which).

### `POST /api/auth/google` — Google sign-in
No auth. Body (zod `googleLoginSchema`): `{ idToken }` — a **Google ID token**, not an access token, obtained on the frontend via Google Identity Services (GIS). This route never talks to the browser or Google's OAuth popup itself — it only verifies a token the frontend already obtained.

**How it works, end to end:**

1. **Frontend** loads Google's GIS script and renders a "Sign in with Google" button (or One Tap), configured with your `GOOGLE_CLIENT_ID`.
2. User clicks it, Google handles the login UI, and on success GIS calls your callback with a **credential** — this is the ID token (a signed JWT from Google, not one this backend issued).
3. Frontend `POST`s that raw ID token as `{ idToken: "<credential>" }` to `/api/auth/google`.
4. Backend verifies it via `google-auth-library`'s `OAuth2Client.verifyIdToken()`, checking the signature and that `audience` matches `GOOGLE_CLIENT_ID` in `.env` — this must be the exact same Client ID configured on the frontend, or verification fails.
5. **First-time login** → creates a `DimUser` row: `role: "USER"`, `googleId` (Google's stable subject id), `email`, `firstName`/`lastName` from the Google profile, `avatarUrl` from the profile picture, `username` auto-derived from the email's local part (e.g. `jane@gmail.com` → `jane`, or `jane1`/`jane2`... if taken). `scopeId`/`groupId`/`psgcCode` are all `null` for USER accounts — they don't need a jurisdiction.
6. **Returning login** → looked up by `googleId`, no new row created.
7. Backend returns `{ token, user }` — same shape as `/api/auth/login`. `token` here is **this backend's own JWT** (signed with `JWT_SECRET`), not Google's token — store *this* one, use it as `Authorization: Bearer <token>` on every subsequent request. The Google ID token is single-use and only relevant for this one exchange.

`200` → `data: { token, user }`. `401` `INVALID_CREDENTIALS` if the ID token doesn't verify (expired, wrong audience, tampered). `403` `FORBIDDEN` if the matched account is deactivated.

**Env var needed:** `GOOGLE_CLIENT_ID` in `backend/.env` — get it from Google Cloud Console → APIs & Services → Credentials → your OAuth 2.0 Client ID (Web application type). Frontend needs the same Client ID (public, safe to expose in frontend code) configured in its GIS init call.

Google sign-in only ever creates `USER`-role accounts — AGENT/SUPERADMIN accounts are created by a SUPERADMIN via `POST /api/users` and always log in with username+password.

### `GET /api/auth/me`
Authenticated (runs through the real `mockAuth` middleware). `200` → `data: <current req.user>` (no `passHash`). Useful for the frontend to rehydrate a session from a stored token.

---

## Roles, Scopes, PSGC codes & Nationwide — how jurisdiction works

This underpins most of the `403`s you'll hit on benefits/requirements/utilizations/attachments, so worth understanding once instead of re-deriving it from each endpoint's condition list.

### Roles (`DimUser.role`)
Three values: `SUPERADMIN`, `AGENT`, `USER`. Checked by `requireRole(PERMISSIONS.X)` — see `constants/permissions.ts` for the exact role list per permission. Roughly:
- **SUPERADMIN** — full access, not tied to any location.
- **AGENT** — can create/edit/delete benefits and their requirements/utilizations/attachments, but only within their own jurisdiction (see Scope below).
- **USER** — read-only (`PARTICIPATE` permission only): list/view benefits, requirements, utilizations, attachments. Always created via Google sign-in, never has a `scopeId`/`groupId`/`psgcCode`.

### Scope (`DimUser.scopeId` → `DimScope.value`)
A scope is a **level in the PSGC hierarchy**, not a specific place. The seeded values, broadest to narrowest: `NATIONAL` → `REGIONS` → `PROVINCES` → `DISTRICTS` → `CITIES-MUNICIPALITIES` → `BARANGAYS`, plus a separate `SUPERADMIN` scope value used only by SUPERADMIN accounts. Fetch the list via `GET /api/scopes`.

An AGENT's scope tells you **what kind of place** they're anchored to; their `psgcCode` tells you **which specific place**. E.g. scope `PROVINCES` + `psgcCode: "0421"` = "agent for Nueva Ecija province specifically," not provinces in general.

`NATIONAL`-scope AGENTs are the exception: they don't need (and don't have) a `psgcCode` — a `NATIONAL` scope already means "no local jurisdiction restriction," equivalent in reach to SUPERADMIN for location purposes, but still a normal AGENT for permission purposes (can't manage users/groups).

### The jurisdiction check itself (`isUserAuthorizedForLocation` in `benefitLocation.service.ts`)
Whenever a benefit is created/edited with `psgcCodes`, every code is resolved against the live PSGC API (`getPsgcLocation`), which also tells you which level it is (region/province/district/city-municipality/barangay). Then:
- `NATIONAL` or `SUPERADMIN` scope → always authorized, any code, any level.
- Any local scope (`REGIONS`/`PROVINCES`/`DISTRICTS`/`CITIES-MUNICIPALITIES`/`BARANGAYS`) → the code is only allowed if it **is** the user's own `psgcCode`, or the code's own ancestor chain at that level matches the user's `psgcCode` (e.g. a `PROVINCES`-scope user with `psgcCode: "0421"` can submit that exact province code, or any city/municipality/barangay code *within* that province — checked via the location's `provinceCode`/`regionCode`/etc. fields, not the user's own level).
- A code the PSGC API doesn't recognize → `400 INVALID_PSGC_CODE`, not a 403 — different failure mode, means the code itself is bad, not that you lack access.
- Mixed-depth `psgcCodes` arrays are fine in one request (e.g. one province code + one barangay code) — each is checked independently against its own resolved level.

This check runs both ways: on **create**, against the codes being submitted; on **edit/delete**, against the benefit's **current** codes too (so you can't lose access to edit something you created if your jurisdiction later narrows, without it also blocking edits from users whose jurisdiction genuinely no longer covers it).

### `nationwide` flag
A benefit can skip location entirely by setting `nationwide: true`:
- Only `NATIONAL`- or `SUPERADMIN`-scope users may set it — `403 FORBIDDEN` otherwise.
- When true, `psgcCodes` is ignored (no `DimBenefitPsgcCode` rows created at all) — the benefit applies everywhere, unconditionally.
- When false (default), `psgcCodes` must have at least one entry — a non-nationwide benefit needs to be anchored somewhere.

### Groups vs. scope — don't conflate them
`groupIds` on a benefit is a completely separate concept from scope/psgcCode — groups are just organizational/ownership tags (which team collaborates on this benefit), not a location or permission boundary. The only interaction: `NATIONAL`-scope agents get their own `groupId` auto-included as `creator: true` so they don't have to repeat it; everyone else (local-scope agents, SUPERADMIN) must supply every group explicitly. `NATIONAL`/`SUPERADMIN` users must end up with at least one group linked (own + submitted, combined) — local-scope agents have no such requirement since they don't have a `groupId` prerequisite baked into the flow the same way.

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

**Attachments hang off a requirement or utilization, never the benefit directly** (per schema design). `entityType` is always `"fct_benefit_requirement"` or `"fct_benefit_utilization"` accordingly, `entityId` is always that requirement/utilization's id — both set server-side, not client input. **Metadata-only** — this route never receives file bytes. Actual file upload happens against Vercel Blob directly (see the "Attachments & Vercel Blob" section below); this route just records the resulting URL + file info.

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
  "filePath": "string, required (the Blob URL from the upload step)",
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
`requireRole(DELETE_BENEFIT_ATTACHMENTS)`. No body. Soft delete. `200` → `data: Attachment`. `404` `ATTACHMENT_NOT_FOUND` / parent not found. **Does not delete the underlying Blob object** — only the DB record. The file stays in Blob storage.

---

## Attachments & Vercel Blob — how the upload flow actually works

Attachments (images, PDFs, Word docs) live in **Vercel Blob**, not on this server and not in the database — the DB only ever stores metadata (filename, type, size) plus the Blob URL. This keeps file bytes off the Express server entirely: the frontend uploads directly to Blob using a short-lived token this backend issues, then registers the resulting URL via the attachment endpoints above.

Two calls are always involved, in order:

```
Frontend                     Our Backend                  Vercel Blob
   |--- POST /api/attachments/upload-token --->|                |
   |                              |--- issues token ----------->|
   |<--------- token -------------|                              |
   |                                                              |
   |------------------- upload file bytes ----------------------->|
   |<------------------------ blob URL -----------------------------|
   |                                                              |
   |--- POST .../attachments (filePath = blob URL) ------------->|
   |<--------------- 201 Attachment record -----------------------|
```

### `POST /api/attachments/upload-token`
`mockAuth` + `requireRole(CREATE_BENEFIT_ATTACHMENTS)` → SUPERADMIN or AGENT. Body is whatever `@vercel/blob/client`'s `upload()` helper sends automatically (a `HandleUploadBody`) — you never construct this by hand, the Blob client SDK calls it for you.

Issues a short-lived client upload token via `@vercel/blob`'s `handleUpload` server helper, restricted to the same `ALLOWED_ATTACHMENT_FILE_TYPES` allowlist the attachment CRUD enforces, max 25MB. Requires the Blob store's read-write token in `backend/.env` (see below) — without it, `400` `BLOB_TOKEN_ERROR`.

### Setting up your own Vercel Blob store (one-time, per developer/environment)
1. Vercel dashboard → **Storage** tab → **Create Database** → **Blob**.
2. Access level: **Public** (attachments are viewed via URL, no signed-read logic exists here).
3. If prompted, enable "Add a read-write token env var to this connection" — this creates a per-store-prefixed variable rather than the plain `BLOB_READ_WRITE_TOKEN` name Vercel's docs usually show.
4. Copy whatever token variable it created (e.g. `BLOB_READ_WRITE_TOKEN_READ_WRITE_TOKEN`) into `backend/.env`. The controller (`attachmentUpload.controller.ts`) passes this value explicitly into `handleUpload({ token: ... })`, so it does not rely on the default env var name — if your store generated a differently-named variable, update the controller's `process.env.X` reference to match.

### Frontend flow

Install: `npm install @vercel/blob`.

**Single file:**
```ts
import { upload } from '@vercel/blob/client';

async function uploadAttachment(file: File, requirementId: string) {
  const blob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/attachments/upload-token',
  });

  return fetch(`/api/benefits/.../requirements/${requirementId}/attachments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileLabel: file.name,
      fileName: file.name,
      fileType: file.type,
      filePath: blob.url,
      fileSize: file.size,
    }),
  }).then((r) => r.json());
}
```

**Multiple files:** no batch endpoint exists — loop and run in parallel:
```ts
async function uploadAttachments(files: File[], requirementId: string) {
  return Promise.all(files.map((file) => uploadAttachment(file, requirementId)));
}
```
Pair with `<input type="file" multiple>`, pass `Array.from(input.files)` in.

### Common pitfalls
- `400 BLOB_TOKEN_ERROR` → Blob token env var missing/misnamed in `backend/.env`.
- `400` zod validation on attachment create → `fileType` doesn't match the allowlist exactly (must be the full MIME string).
- `fileSize` comes back as a **string** (e.g. `"204800"`) — it's a `BigInt` column, always JSON-serialized as a string.
- Deleting an attachment record does **not** delete the file from Blob — it's a soft delete in the DB only.

---

## Benefit Bundles — `/api/benefit-bundles`

Convenience routes that create/edit a benefit **and** its requirements/utilizations/attachments in a single request, instead of calling the individual endpoints above one at a time. Built on top of the same services those individual endpoints use — same validation, same permission checks, same error codes. The whole operation runs inside **one database transaction**: if anything fails partway through (bad PSGC code, forbidden scope, invalid attachment type, a bad `id` reference...), everything in that request rolls back — no partial benefit ever gets left behind.

Attachments still need to be uploaded to Blob **first** (see the section above) — this endpoint never touches file bytes, only stores the resulting `filePath` URLs you pass in.

### `POST /api/benefit-bundles` — create everything at once
`mockAuth` + `requireRole(CREATE_BENEFITS)` → SUPERADMIN or AGENT.

Body: same shape as `POST /api/benefits`, plus `requirements[]` and `utilizations[]`, each of which can carry its own `attachments[]`:
```json
{
  "name": "string, required",
  "englishDescription": "string",
  "tagalogDescription": "string",
  "nationwide": false,
  "psgcCodes": ["042114000"],
  "groupIds": ["uuid"],
  "requirements": [
    {
      "englishName": "string, required",
      "tagalogName": "string, required",
      "englishDescription": "string, required",
      "tagalogDescription": "string, required",
      "attachments": [
        {
          "fileLabel": "string, required",
          "fileName": "string, required",
          "fileType": "one of the allowed mime types",
          "filePath": "string, required (Blob URL)",
          "fileSize": 204800,
          "metaData": {}
        }
      ]
    }
  ],
  "utilizations": [
    { "englishName": "...", "tagalogName": "...", "englishDescription": "...", "tagalogDescription": "...", "attachments": [] }
  ]
}
```
`201` → `data: Benefit & { requirements: Requirement[], utilizations: Utilization[] }` (each requirement/utilization includes its created `attachments[]`, `fileSize` already stringified). Errors: same set as `POST /api/benefits`, plus whatever a nested requirement/utilization/attachment create can throw (`403 FORBIDDEN`, `404 BENEFIT_NOT_FOUND`, `400` zod validation) — any of these rolls back the entire bundle.

### `PATCH /api/benefit-bundles/:id` — edit everything at once
`mockAuth` + `requireRole(EDIT_BENEFITS)` → SUPERADMIN or AGENT.

Same body shape as create, but each requirement/utilization/attachment object may include an `id`:
- **`id` present** → edits that existing row.
- **`id` absent** → creates a new row.
- **Existing row omitted from the payload entirely** → left untouched, **not deleted**. Use the individual `DELETE` endpoints (`/api/benefits/:benefitId/requirements/:id`, etc.) to actually remove something.

`200` → `data: Benefit & { requirements: Requirement[], utilizations: Utilization[] }`, same shape as create. Errors: same set as `PATCH /api/benefits/:id`, plus `404 REQUIREMENT_NOT_FOUND` / `UTILIZATION_NOT_FOUND` / `ATTACHMENT_NOT_FOUND` if an `id` doesn't resolve to an existing row under this benefit — any failure rolls back the whole edit, including earlier items already processed in the same request.

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

(Groups' controller and users' `assignRoleAndScope`/`createUser` controllers each layer their own bespoke `message`/`errorCode` per action rather than using the shared table verbatim — see each section above.)
