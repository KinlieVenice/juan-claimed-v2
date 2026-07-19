# Manual test (Postman): benefit requirements / utilizations / attachments

Mock auth — no login. Add header `x-user-id: <seeded-user-id>` on every request.

Base URL: `http://localhost:4000` (start server: `npm run dev`, port from `BACKEND_PORT`).

## Seeded users

| Email | ID | Role | Scope | psgcCode |
|---|---|---|---|---|
| agent.doh@juanclaimed.com | `2968a7f5-f9d1-4543-84cb-c83d1844f21c` | AGENT | NATIONAL | `null` |
| agent.cavite@juanclaimed.com | `05fbad90-197f-4363-9aa2-e6cb69d5e091` | AGENT | CITIES-MUNICIPALITIES | `042114000` |
| juan.delacruz@gmail.com | `c7ff030f-6c55-4f86-8b42-d2b2c09fe563` | USER | — | `null` |

## Setup in Postman

1. New Collection, e.g. "Benefit Sub-resources".
2. Collection-level variable `baseUrl = http://localhost:4000`.
3. Collection-level variable `userId = 05fbad90-197f-4363-9aa2-e6cb69d5e091` (the local agent — swap to test other roles).
4. On the Collection's **Headers** tab (applies to all requests in it), add:
   - `Content-Type: application/json`
   - `x-user-id: {{userId}}`
5. Add a variable `benefitId` (leave blank for now) — you'll fill it after step 1 below.

## 1. Create a benefit to attach things to

`POST {{baseUrl}}/api/benefits`

Body (raw JSON):
```json
{
  "name": "Postman Test Benefit",
  "englishDescription": "e",
  "tagalogDescription": "t",
  "psgcCodes": ["042114000"]
}
```
Expect `201`. Copy `data.id` from the response into your `benefitId` collection variable (Postman tip: add a **Tests** tab script to auto-set it: `pm.collectionVariables.set("benefitId", pm.response.json().data.id);`).

## 2. Requirements — `{{baseUrl}}/api/benefits/{{benefitId}}/requirements`

**List** — `GET` (no body). Expect `200`, `data: []`.

**Create** — `POST`
```json
{
  "englishName": "Valid ID",
  "tagalogName": "Balidong ID",
  "englishDescription": "Any government-issued ID",
  "tagalogDescription": "Anumang ID na inisyu ng gobyerno"
}
```
Expect `201`. Copy `data.id` → variable `requirementId`.

**Edit** — `PATCH` `{{baseUrl}}/api/benefits/{{benefitId}}/requirements/{{requirementId}}`, same body shape, change a value. Expect `200`, `updatedById` now set.

**Delete** — `DELETE` (no body) same URL. Expect `200`, `deletedAt` set.

**List again** — `GET` — deleted requirement no longer appears.

## 3. Utilizations — `{{baseUrl}}/api/benefits/{{benefitId}}/utilizations`

Same 4 requests as requirements, same body shape (`englishName`/`tagalogName`/`englishDescription`/`tagalogDescription`).

## 4. Attachments — `{{baseUrl}}/api/benefits/{{benefitId}}/attachments`

Metadata-only — no real file upload here, you're registering a record that points at a file already stored elsewhere (URL/path).

**Create — valid type** — `POST`
```json
{
  "fileLabel": "Application Form",
  "fileName": "form.pdf",
  "fileType": "application/pdf",
  "filePath": "https://example.com/form.pdf",
  "fileSize": 204800,
  "metaData": { "pages": 3 }
}
```
Expect `201`. Note `fileSize` comes back as a **string** (`"204800"`) — it's a `BigInt` column, intentionally serialized to string since raw BigInt can't go through `JSON.stringify`.

**Create — rejected type** — same request, change `fileType` to `"application/x-msdownload"` (or anything not in the allowlist). Expect `400`:
```json
{
  "success": false,
  "message": "Invalid request payload.",
  "error": "fileType: fileType must be one of: image/jpg, image/jpeg, image/png, image/gif, image/webp, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "errorCode": "VALIDATION_ERROR"
}
```

Allowed `fileType` values (exact strings, from `benefitAttachment.request.ts`):
- `image/jpg`, `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- `application/pdf`
- `application/msword` (.doc)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx)

**Edit / Delete / List** — same pattern as requirements (`PATCH`/`DELETE` with `/:id`, `GET` for list), copy the created attachment's `id` into an `attachmentId` variable first.

## 5. Authorization checks

Switch `userId` collection variable to `c7ff030f-6c55-4f86-8b42-d2b2c09fe563` (plain USER role, no scope) and repeat any Create request above → expect `403`.

Switch back to the local agent, then try acting on a **nonexistent** benefit:

`POST {{baseUrl}}/api/benefits/00000000-0000-0000-0000-000000000000/requirements` (any valid body) → expect `404` (`BENEFIT_NOT_FOUND`).

## 6. Cleanup

`DELETE {{baseUrl}}/api/benefits/{{benefitId}}` — soft-deletes the whole test benefit (and its requirement/utilization/attachment rows aren't auto-deleted by this call, but they're orphaned test data — fine to leave, or delete them individually first via steps 2-4's delete calls).

## Status-code reference

| Error prefix | HTTP |
|---|---|
| Prisma `P2002` (duplicate) | 409 |
| `*_NOT_FOUND` (e.g. `BENEFIT_NOT_FOUND`, `REQUIREMENT_NOT_FOUND`, `UTILIZATION_NOT_FOUND`, `ATTACHMENT_NOT_FOUND`) | 404 |
| zod validation failure (`VALIDATION_ERROR`) | 400 |
| `INVALID_INPUT`, `INVALID_PSGC_CODE` | 400 |
| `SCOPE_NOT_FOUND` | 500 |
| `FORBIDDEN`, `UNAUTHORIZED_SCOPE` | 403 |
| no `x-user-id` header / unknown user id | 401 |
