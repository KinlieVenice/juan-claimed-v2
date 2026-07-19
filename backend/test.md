# Manual test: createBenefit / editBenefit / deleteBenefit

Mock auth — pass `x-user-id: <seeded-user-id>` header. No real login needed.

## Seeded users (from `prisma/seed.ts`)

| Email | ID | Role | Scope | psgcCode |
|---|---|---|---|---|
| superadmin@juanclaimed.com | `84b1d088-6d24-4291-8c70-c491eefb30d6` | SUPERADMIN | SUPERADMIN | `SUPERADMIN` |
| agent.doh@juanclaimed.com | `2968a7f5-f9d1-4543-84cb-c83d1844f21c` | AGENT | NATIONAL | `null` |
| agent.cavite@juanclaimed.com | `05fbad90-197f-4363-9aa2-e6cb69d5e091` | AGENT | CITIES-MUNICIPALITIES | `042114000` |
| juan.delacruz@gmail.com | `c7ff030f-6c55-4f86-8b42-d2b2c09fe563` | USER | — | `null` |

DOH group id (for `groupIds`): `61c6a263-89c4-4c51-894e-c31646bbad08`

Start server: `npm run dev` (port 4000, override via `BACKEND_PORT`).

## 1. Create — nationwide (NATIONAL user)

```bash
curl -s -X POST http://localhost:4000/api/benefits \
  -H "Content-Type: application/json" \
  -H "x-user-id: 2968a7f5-f9d1-4543-84cb-c83d1844f21c" \
  -d '{
    "name": "Test Nationwide",
    "englishDescription": "desc en",
    "tagalogDescription": "desc tl",
    "nationwide": true,
    "groupIds": ["61c6a263-89c4-4c51-894e-c31646bbad08"]
  }'
```
Expect: `201`, `isNationwide: true`, `benefitPsgcCodes: []`.

## 2. Create — nationwide, non-NATIONAL user (expect 403)

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4000/api/benefits \
  -H "Content-Type: application/json" \
  -H "x-user-id: 05fbad90-197f-4363-9aa2-e6cb69d5e091" \
  -d '{"name":"Bad","englishDescription":"e","tagalogDescription":"t","nationwide":true}'
```
Expect: `403`.

## 3. Create — local, real PSGC code

```bash
curl -s -X POST http://localhost:4000/api/benefits \
  -H "Content-Type: application/json" \
  -H "x-user-id: 05fbad90-197f-4363-9aa2-e6cb69d5e091" \
  -d '{"name":"Local Benefit","englishDescription":"e","tagalogDescription":"t","psgcCodes":["042114000"]}'
```
Expect: `201`, one `benefitPsgcCodes` row with `locationName` populated. Save the returned `id` as `$BENEFIT_ID` for the next steps.

## 4. Edit — nationwide benefit, resubmit unchanged (regression: was P2002 before upsert fix)

```bash
curl -s -X PATCH http://localhost:4000/api/benefits/$BENEFIT_ID \
  -H "Content-Type: application/json" \
  -H "x-user-id: 2968a7f5-f9d1-4543-84cb-c83d1844f21c" \
  -d '{
    "name": "Test Nationwide EDITED",
    "englishDescription": "desc en2",
    "tagalogDescription": "desc tl2",
    "nationwide": true,
    "groupIds": ["61c6a263-89c4-4c51-894e-c31646bbad08"]
  }'
```
Expect: `200`, `updatedById` set, same group row kept (not duplicated).

## 5. Edit — unauthorized code (different province, expect 403)

```bash
curl -s -X PATCH http://localhost:4000/api/benefits/$BENEFIT_ID \
  -H "Content-Type: application/json" \
  -H "x-user-id: 05fbad90-197f-4363-9aa2-e6cb69d5e091" \
  -d '{"name":"x","englishDescription":"e","tagalogDescription":"t","psgcCodes":["133900000"]}'
```
Expect: `403` `FORBIDDEN`.

## 6. Edit — by user outside the benefit's own jurisdiction (expect 403)

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:4000/api/benefits/$BENEFIT_ID \
  -H "Content-Type: application/json" \
  -H "x-user-id: 05fbad90-197f-4363-9aa2-e6cb69d5e091" \
  -d '{"name":"hack","englishDescription":"e","tagalogDescription":"t","nationwide":true}'
```
Expect: `403` (non-NATIONAL user touching a nationwide benefit).

## 7. Delete

```bash
curl -s -X DELETE http://localhost:4000/api/benefits/$BENEFIT_ID \
  -H "x-user-id: 2968a7f5-f9d1-4543-84cb-c83d1844f21c"
```
Expect: `200`, `{ id, deletedAt }`.

## 8. Post-delete: edit/delete again (expect 404)

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:4000/api/benefits/$BENEFIT_ID \
  -H "Content-Type: application/json" \
  -H "x-user-id: 2968a7f5-f9d1-4543-84cb-c83d1844f21c" \
  -d '{"name":"x","englishDescription":"e","tagalogDescription":"t","nationwide":true}'

curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:4000/api/benefits/00000000-0000-0000-0000-000000000000 \
  -H "x-user-id: 2968a7f5-f9d1-4543-84cb-c83d1844f21c"
```
Expect: `404` `BENEFIT_NOT_FOUND` both times.

## Status-code reference (see `handleBenefitError` in `benefit.controller.ts`)

| Error prefix | HTTP |
|---|---|
| `P2002` (Prisma) | 409 |
| `*_NOT_FOUND` (e.g. `BENEFIT_NOT_FOUND`) | 404 |
| `INVALID_INPUT`, `INVALID_PSGC_CODE` | 400 |
| `SCOPE_NOT_FOUND` | 500 |
| `FORBIDDEN`, `UNAUTHORIZED_SCOPE` | 403 |
| anything else | 500 |
