# Full route test pass (happy + unhappy paths)

Base URL: `http://localhost:4000`. Start server: `npm run dev`.

Every request below is a `curl` snippet you can paste directly. Response bodies noted are Shape B: `{ success, message, error, errorCode, data }` unless stated otherwise (fields/groups have bespoke shapes).

## Seeded users

| Role | Scope | psgcCode | groupId | id |
|---|---|---|---|---|
| SUPERADMIN | SUPERADMIN | `SUPERADMIN` | Superadmin Group `6ae4d29d-f7bd-405d-bb14-bdf7c60a34bb` | `84b1d088-6d24-4291-8c70-c491eefb30d6` |
| AGENT | NATIONAL | `null` | DOH `61c6a263-89c4-4c51-894e-c31646bbad08` | `2968a7f5-f9d1-4543-84cb-c83d1844f21c` |
| AGENT | CITIES-MUNICIPALITIES | `042114000` (Mendez, Cavite) | `null` | `05fbad90-197f-4363-9aa2-e6cb69d5e091` |
| USER | — | `null` | `null` | `c7ff030f-6c55-4f86-8b42-d2b2c09fe563` |

Shorthand used below:
- `$SUPER` = `84b1d088-6d24-4291-8c70-c491eefb30d6`
- `$NATL` = `2968a7f5-f9d1-4543-84cb-c83d1844f21c`
- `$LOCAL` = `05fbad90-197f-4363-9aa2-e6cb69d5e091`
- `$USER` = `c7ff030f-6c55-4f86-8b42-d2b2c09fe563`
- `$DOH_GROUP` = `61c6a263-89c4-4c51-894e-c31646bbad08`
- `$IN_JURISDICTION` = `042114002` (a barangay inside Mendez — valid for `$LOCAL`)
- `$OUT_OF_JURISDICTION` = `133900000` (a different province — invalid for `$LOCAL`)
- `$BOGUS_CODE` = `999999999` (doesn't exist in PSGC API)
- `$NIL` = `00000000-0000-0000-0000-000000000000` (a syntactically valid but nonexistent uuid)

Export them in your shell first — **use one continuous terminal for this entire doc**; every `export` and every captured id only exists in the session it was set in. If you open a new terminal or it restarts, all `$VAR`s go back to empty and any command using them silently breaks (usually surfacing as a confusing 404 because the URL becomes `.../benefits/` with no id).

```bash
export SUPER=84b1d088-6d24-4291-8c70-c491eefb30d6
export NATL=2968a7f5-f9d1-4543-84cb-c83d1844f21c
export LOCAL=05fbad90-197f-4363-9aa2-e6cb69d5e091
export USERID=c7ff030f-6c55-4f86-8b42-d2b2c09fe563
export DOH_GROUP=61c6a263-89c4-4c51-894e-c31646bbad08
export IN_JUR=042114002
export OUT_JUR=133900000
export BOGUS=999999999
export NIL=00000000-0000-0000-0000-000000000000
```

**Whenever a step says "SAVE id as $X"**, it means: capture the response, extract `data.id` with `grep`/`cut`, and `export` it, like this pattern (shown once here, applied at every such step below):
```bash
RESP=$(curl -s -X POST http://localhost:4000/api/benefits \
  -H "Content-Type: application/json" -H "x-user-id: $NATL" \
  -d '{"name":"...","englishDescription":"...","tagalogDescription":"...", ...}')
export NATL_BENEFIT=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "NATL_BENEFIT=$NATL_BENEFIT"   # confirm it's not empty before continuing
```
`grep -o '"id":"[^"]*"' | head -1` grabs the *first* `"id":"..."` key in the JSON (the top-level one, since nested objects like `benefitPsgcCodes[].id` come later in the string) — good enough for these flat responses. Always `echo` the var after exporting it once to confirm it's not empty before running the next command that depends on it.

---

## Health

```bash
curl -s http://localhost:4000/health
# expect 200, raw (not Shape B)
```

---

## Fields — `/api/fields` (no auth on any of these)

```bash
# happy: list
curl -s http://localhost:4000/api/fields
# expect 200

# unhappy: get nonexistent
curl -s -w "\n%{http_code}\n" http://localhost:4000/api/fields/$NIL
# expect 404 FIELD_NOT_FOUND

# unhappy: create with missing required field (key)
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/fields \
  -H "Content-Type: application/json" \
  -d '{"englishName":"x","tagalogName":"x","description":"x","classification":"GLOBAL","default":false,"required":true,"sortOrder":0,"configJson":null,"fieldInputTypeId":"x","parentFieldId":null,"fieldHierarchyId":null}'
# expect 400 (zod, no key)

# unhappy: create with bad foreign key
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/fields \
  -H "Content-Type: application/json" \
  -d '{"key":"test_field_'"$RANDOM"'","englishName":"x","tagalogName":"x","description":"x","classification":"GLOBAL","default":false,"required":true,"sortOrder":0,"configJson":null,"fieldInputTypeId":"'"$NIL"'","parentFieldId":null,"fieldHierarchyId":null}'
# expect 400 INVALID_FOREIGN_KEY

# unhappy: update nonexistent
curl -s -w "\n%{http_code}\n" -X PUT http://localhost:4000/api/fields/$NIL \
  -H "Content-Type: application/json" \
  -d '{"key":"x","englishName":"x","tagalogName":"x","description":"x","classification":"GLOBAL","default":false,"required":true,"sortOrder":0,"configJson":null,"fieldInputTypeId":"x","parentFieldId":null,"fieldHierarchyId":null}'
# expect 404 FIELD_NOT_FOUND

# unhappy: delete nonexistent
curl -s -w "\n%{http_code}\n" -X DELETE http://localhost:4000/api/fields/$NIL
# expect 404 FIELD_NOT_FOUND
```

---

## Groups — `/api/groups`

```bash
# happy: list (no auth needed)
curl -s http://localhost:4000/api/groups
# expect 200

# unhappy: get nonexistent
curl -s -w "\n%{http_code}\n" http://localhost:4000/api/groups/$NIL
# expect 404 GROUP_NOT_FOUND

# unhappy: create without auth
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/groups \
  -H "Content-Type: application/json" \
  -d '{"englishName":"Test Group","tagalogName":"Test","englishDescription":"e","tagalogDescription":"t"}'
# expect 401 (no x-user-id)

# unhappy: create as non-superadmin (AGENT), expect 403
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/groups \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"englishName":"Test Group","tagalogName":"Test","englishDescription":"e","tagalogDescription":"t"}'
# expect 403

# unhappy: create as SUPERADMIN with missing required field, expect 400
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/groups \
  -H "Content-Type: application/json" -H "x-user-id: $SUPER" \
  -d '{"tagalogName":"Test","englishDescription":"e","tagalogDescription":"t"}'
# expect 400 VALIDATION_ERROR

# happy: create as SUPERADMIN
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/groups \
  -H "Content-Type: application/json" -H "x-user-id: $SUPER" \
  -d '{"englishName":"Test Group","tagalogName":"Test","englishDescription":"e","tagalogDescription":"t"}'
# expect 201
```

---

## Users — `/api/users`

```bash
# unhappy: list without auth
curl -s -w "\n%{http_code}\n" http://localhost:4000/api/users
# expect 401

# happy: list
curl -s http://localhost:4000/api/users -H "x-user-id: $SUPER"
# expect 200, no passHash in any row

# unhappy: get nonexistent user
curl -s -w "\n%{http_code}\n" http://localhost:4000/api/users/$NIL -H "x-user-id: $SUPER"
# expect 404 USER_NOT_FOUND

# unhappy: create as non-superadmin (AGENT), expect 403
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" -H "x-user-id: $NATL" \
  -d '{"username":"nope","email":"nope@test.com","firstName":"N","lastName":"O","role":"USER"}'
# expect 403

# unhappy: create USER role WITH password, expect 400
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" -H "x-user-id: $SUPER" \
  -d '{"username":"badpwuser","email":"badpwuser@test.com","firstName":"N","lastName":"O","role":"USER","password":"secret123"}'
# expect 400 (zod refine)

# unhappy: create AGENT WITHOUT password, expect 400
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" -H "x-user-id: $SUPER" \
  -d '{"username":"nopwagent","email":"nopwagent@test.com","firstName":"N","lastName":"O","role":"AGENT","scopeId":"701cf9b3-220a-493d-a480-9297a7c3dcb8","psgcCode":"042114000"}'
# expect 400 (zod refine)

# unhappy: create AGENT + NATIONAL scope + no groupId, expect 400 INVALID_NATIONAL_AGENT_CONFIG
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" -H "x-user-id: $SUPER" \
  -d '{"username":"badnatlagent","email":"badnatlagent@test.com","firstName":"N","lastName":"O","role":"AGENT","scopeId":"82713327-a389-4093-8024-01f87a4d9228","password":"secret123"}'
# expect 400 INVALID_NATIONAL_AGENT_CONFIG

# unhappy: create with invalid scopeId, expect 404 INVALID_SCOPE
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" -H "x-user-id: $SUPER" \
  -d '{"username":"badscopeagent","email":"badscopeagent@test.com","firstName":"N","lastName":"O","role":"AGENT","scopeId":"'"$NIL"'","psgcCode":"042114000","password":"secret123"}'
# expect 404 INVALID_SCOPE

# happy: create valid local AGENT — capture id as $NEWAGENT
RESP=$(curl -s -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" -H "x-user-id: $SUPER" \
  -d '{"username":"testagent_'"$RANDOM"'","email":"testagent_'"$RANDOM"'@test.com","firstName":"Test","lastName":"Agent","role":"AGENT","scopeId":"701cf9b3-220a-493d-a480-9297a7c3dcb8","psgcCode":"042114000","password":"secret123"}')
export NEWAGENT=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "NEWAGENT=$NEWAGENT"
echo "$RESP"
# expect 201, no passHash in response

# unhappy: duplicate username, expect 409
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" -H "x-user-id: $SUPER" \
  -d '{"username":"testagent_DUPLICATE_TRY_TWICE","email":"unique1@test.com","firstName":"N","lastName":"O","role":"USER"}'
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" -H "x-user-id: $SUPER" \
  -d '{"username":"testagent_DUPLICATE_TRY_TWICE","email":"unique2@test.com","firstName":"N","lastName":"O","role":"USER"}'
# expect 201 then 409

# unhappy: assignRole on nonexistent user, expect 404
curl -s -w "\n%{http_code}\n" -X PATCH http://localhost:4000/api/users/$NIL/role \
  -H "Content-Type: application/json" -H "x-user-id: $SUPER" \
  -d '{"role":"USER"}'
# expect 404 USER_NOT_FOUND

# unhappy: assignRole as non-superadmin, expect 403
curl -s -w "\n%{http_code}\n" -X PATCH http://localhost:4000/api/users/$NEWAGENT/role \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"role":"USER"}'
# expect 403
```

---

## Scopes — `/api/scopes`

```bash
# unhappy: no auth
curl -s -w "\n%{http_code}\n" http://localhost:4000/api/scopes
# expect 401

# happy: list
curl -s http://localhost:4000/api/scopes -H "x-user-id: $USERID"
# expect 200, 7 rows (any authenticated role can read)
```

---

## Benefits — `/api/benefits`

```bash
# unhappy: no auth
curl -s -w "\n%{http_code}\n" http://localhost:4000/api/benefits
# expect 401

# happy: list
curl -s http://localhost:4000/api/benefits -H "x-user-id: $USERID"
# expect 200

# unhappy: get nonexistent
curl -s -w "\n%{http_code}\n" http://localhost:4000/api/benefits/$NIL -H "x-user-id: $USERID"
# expect 404 BENEFIT_NOT_FOUND

# unhappy: create as plain USER (no CREATE_BENEFITS permission), expect 403
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/benefits \
  -H "Content-Type: application/json" -H "x-user-id: $USERID" \
  -d '{"name":"x","englishDescription":"e","tagalogDescription":"t","psgcCodes":["'"$IN_JUR"'"]}'
# expect 403 (role gate)

# unhappy: create with no psgcCodes and nationwide not set, expect 400
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/benefits \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"name":"x","englishDescription":"e","tagalogDescription":"t"}'
# expect 400 (zod refine: psgcCodes required unless nationwide)

# unhappy: create with bogus PSGC code, expect 400 INVALID_PSGC_CODE
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/benefits \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"name":"x","englishDescription":"e","tagalogDescription":"t","psgcCodes":["'"$BOGUS"'"]}'
# expect 400 INVALID_PSGC_CODE

# unhappy: local user submits code outside jurisdiction, expect 403 FORBIDDEN
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/benefits \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"name":"x","englishDescription":"e","tagalogDescription":"t","psgcCodes":["'"$OUT_JUR"'"]}'
# expect 403 FORBIDDEN

# unhappy: local user attempts nationwide, expect 403
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/benefits \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"name":"x","englishDescription":"e","tagalogDescription":"t","nationwide":true}'
# expect 403 FORBIDDEN

# unhappy: SUPERADMIN nationwide with no groupIds, expect 400 INVALID_INPUT
# (SUPERADMIN never has their own groupId, so this always requires explicit groupIds)
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/benefits \
  -H "Content-Type: application/json" -H "x-user-id: $SUPER" \
  -d '{"name":"x","englishDescription":"e","tagalogDescription":"t","nationwide":true}'
# expect 400 INVALID_INPUT

# happy: SUPERADMIN nationwide WITH explicit groupIds
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/benefits \
  -H "Content-Type: application/json" -H "x-user-id: $SUPER" \
  -d '{"name":"x","englishDescription":"e","tagalogDescription":"t","nationwide":true,"groupIds":["'"$DOH_GROUP"'"]}'
# expect 201, benefitGroups[0].creator should be FALSE (supplied via body, not auto-owned)

# happy: NATIONAL agent creates nationwide, no groupIds needed (own group auto-attaches) — capture id as $NATL_BENEFIT
RESP=$(curl -s -X POST http://localhost:4000/api/benefits \
  -H "Content-Type: application/json" -H "x-user-id: $NATL" \
  -d '{"name":"Nationwide Test","englishDescription":"e","tagalogDescription":"t","nationwide":true}')
export NATL_BENEFIT=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "NATL_BENEFIT=$NATL_BENEFIT"
echo "$RESP"
# expect 201. benefitGroups[0].creator should be true, groupId = DOH_GROUP

# happy: local agent creates benefit in-jurisdiction — capture id as $LOCAL_BENEFIT
RESP=$(curl -s -X POST http://localhost:4000/api/benefits \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"name":"Local Test","englishDescription":"e","tagalogDescription":"t","psgcCodes":["'"$IN_JUR"'"]}')
export LOCAL_BENEFIT=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "LOCAL_BENEFIT=$LOCAL_BENEFIT"
echo "$RESP"
# expect 201

# unhappy: duplicate psgcCode on same benefit — edit twice with same code shouldn't 409 (upsert), but a genuinely
# duplicate nested create in one payload isn't possible via this schema (array naturally dedupes at DB via unique constraint
# only if you engineer two identical entries — skip, low value)

# unhappy: edit nonexistent benefit, expect 404
curl -s -w "\n%{http_code}\n" -X PATCH http://localhost:4000/api/benefits/$NIL \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"name":"x","englishDescription":"e","tagalogDescription":"t","psgcCodes":["'"$IN_JUR"'"]}'
# expect 404 BENEFIT_NOT_FOUND

# unhappy: edit benefit you're not authorized over (local user editing nationwide benefit), expect 403
curl -s -w "\n%{http_code}\n" -X PATCH http://localhost:4000/api/benefits/$NATL_BENEFIT \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"name":"hack","englishDescription":"e","tagalogDescription":"t","nationwide":true}'
# expect 403 FORBIDDEN

# happy: edit own benefit
curl -s -w "\n%{http_code}\n" -X PATCH http://localhost:4000/api/benefits/$LOCAL_BENEFIT \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"name":"Local Test Renamed","englishDescription":"e2","tagalogDescription":"t2","psgcCodes":["'"$IN_JUR"'"]}'
# expect 200

# unhappy: delete nonexistent, expect 404
curl -s -w "\n%{http_code}\n" -X DELETE http://localhost:4000/api/benefits/$NIL -H "x-user-id: $LOCAL"
# expect 404 BENEFIT_NOT_FOUND

# unhappy: delete benefit you're not authorized over, expect 403
curl -s -w "\n%{http_code}\n" -X DELETE http://localhost:4000/api/benefits/$NATL_BENEFIT -H "x-user-id: $LOCAL"
# expect 403 FORBIDDEN
```

---

## Benefit Requirements — `/api/benefits/:benefitId/requirements`

Using `$LOCAL_BENEFIT` from above.

```bash
# happy: list (empty initially)
curl -s http://localhost:4000/api/benefits/$LOCAL_BENEFIT/requirements -H "x-user-id: $USERID"
# expect 200, []

# unhappy: create on nonexistent benefit, expect 404
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/benefits/$NIL/requirements \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"englishName":"ID","tagalogName":"ID","englishDescription":"x","tagalogDescription":"x"}'
# expect 404 BENEFIT_NOT_FOUND

# unhappy: create by unauthorized user (outside jurisdiction), expect 403
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/benefits/$NATL_BENEFIT/requirements \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"englishName":"ID","tagalogName":"ID","englishDescription":"x","tagalogDescription":"x"}'
# expect 403 FORBIDDEN

# unhappy: create with missing field, expect 400
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/benefits/$LOCAL_BENEFIT/requirements \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"englishName":"ID"}'
# expect 400 (zod)

# happy: create — capture id as $REQ_ID
RESP=$(curl -s -X POST http://localhost:4000/api/benefits/$LOCAL_BENEFIT/requirements \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"englishName":"Valid ID","tagalogName":"Balidong ID","englishDescription":"x","tagalogDescription":"x"}')
export REQ_ID=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "REQ_ID=$REQ_ID"
echo "$RESP"
# expect 201

# unhappy: edit nonexistent requirement, expect 404
curl -s -w "\n%{http_code}\n" -X PATCH http://localhost:4000/api/benefits/$LOCAL_BENEFIT/requirements/$NIL \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"englishName":"x","tagalogName":"x","englishDescription":"x","tagalogDescription":"x"}'
# expect 404 REQUIREMENT_NOT_FOUND

# happy: edit
curl -s -w "\n%{http_code}\n" -X PATCH http://localhost:4000/api/benefits/$LOCAL_BENEFIT/requirements/$REQ_ID \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"englishName":"Valid ID Updated","tagalogName":"x","englishDescription":"x","tagalogDescription":"x"}'
# expect 200

# unhappy: delete nonexistent, expect 404
curl -s -w "\n%{http_code}\n" -X DELETE http://localhost:4000/api/benefits/$LOCAL_BENEFIT/requirements/$NIL -H "x-user-id: $LOCAL"
# expect 404 REQUIREMENT_NOT_FOUND

# (keep $REQ_ID alive for the attachment tests below — don't delete yet)
```

---

## Benefit Utilizations — `/api/benefits/:benefitId/utilizations`

Same pattern as requirements — repeat each case with `/utilizations` and body fields `englishName`/`tagalogName`/`englishDescription`/`tagalogDescription`. Not-found code is `UTILIZATION_NOT_FOUND`.

```bash
RESP=$(curl -s -X POST http://localhost:4000/api/benefits/$LOCAL_BENEFIT/utilizations \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"englishName":"Claim","tagalogName":"Claim","englishDescription":"x","tagalogDescription":"x"}')
export UTIL_ID=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "UTIL_ID=$UTIL_ID"
echo "$RESP"
# expect 201
```

---

## Benefit Requirement Attachments — `/api/benefits/:benefitId/requirements/:id/attachments`

Using `$REQ_ID` from above.

```bash
# unhappy: create on nonexistent requirement, expect 404 REQUIREMENT_NOT_FOUND
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/benefits/$LOCAL_BENEFIT/requirements/$NIL/attachments \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"fileLabel":"x","fileName":"x.pdf","fileType":"application/pdf","filePath":"https://x/y.pdf","fileSize":10}'
# expect 404 REQUIREMENT_NOT_FOUND

# unhappy: create with disallowed fileType, expect 400
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/benefits/$LOCAL_BENEFIT/requirements/$REQ_ID/attachments \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"fileLabel":"x","fileName":"virus.exe","fileType":"application/x-msdownload","filePath":"https://x/y","fileSize":10}'
# expect 400 (zod, fileType not in allowlist)

# unhappy: create with negative fileSize, expect 400
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/benefits/$LOCAL_BENEFIT/requirements/$REQ_ID/attachments \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"fileLabel":"x","fileName":"x.pdf","fileType":"application/pdf","filePath":"https://x/y","fileSize":-5}'
# expect 400 (zod)

# happy: create — capture id as $ATTACH_ID
RESP=$(curl -s -X POST http://localhost:4000/api/benefits/$LOCAL_BENEFIT/requirements/$REQ_ID/attachments \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"fileLabel":"Sample Form","fileName":"form.pdf","fileType":"application/pdf","filePath":"https://example.com/form.pdf","fileSize":204800,"metaData":{"pages":3}}')
export ATTACH_ID=$(echo "$RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "ATTACH_ID=$ATTACH_ID"
echo "$RESP"
# expect 201, fileSize returned as string "204800"

# unhappy: edit nonexistent attachment, expect 404 ATTACHMENT_NOT_FOUND
curl -s -w "\n%{http_code}\n" -X PATCH http://localhost:4000/api/benefits/$LOCAL_BENEFIT/requirements/$REQ_ID/attachments/$NIL \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"fileLabel":"x","fileName":"x.pdf","fileType":"application/pdf","filePath":"https://x/y","fileSize":10}'
# expect 404 ATTACHMENT_NOT_FOUND

# happy: delete
curl -s -w "\n%{http_code}\n" -X DELETE http://localhost:4000/api/benefits/$LOCAL_BENEFIT/requirements/$REQ_ID/attachments/$ATTACH_ID -H "x-user-id: $LOCAL"
# expect 200

# unhappy: old flat route no longer exists, expect 404 (route not found, not app-level error)
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/benefits/$LOCAL_BENEFIT/attachments \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"fileLabel":"x","fileName":"x.pdf","fileType":"application/pdf","filePath":"https://x/y","fileSize":10}'
# expect 404 (Express "Cannot POST", not JSON envelope — this route was removed)
```

---

## Benefit Utilization Attachments — `/api/benefits/:benefitId/utilizations/:id/attachments`

Same pattern as requirement attachments, using `$UTIL_ID`. Not-found code for missing parent is `UTILIZATION_NOT_FOUND`.

```bash
curl -s -w "\n%{http_code}\n" -X POST http://localhost:4000/api/benefits/$LOCAL_BENEFIT/utilizations/$UTIL_ID/attachments \
  -H "Content-Type: application/json" -H "x-user-id: $LOCAL" \
  -d '{"fileLabel":"Receipt","fileName":"receipt.png","fileType":"image/png","filePath":"https://example.com/r.png","fileSize":5000}'
# expect 201
```

---

## Cleanup

```bash
curl -s -X DELETE http://localhost:4000/api/benefits/$NATL_BENEFIT -H "x-user-id: $NATL" > /dev/null
curl -s -X DELETE http://localhost:4000/api/benefits/$LOCAL_BENEFIT -H "x-user-id: $LOCAL" > /dev/null
```
(Users/groups created during this pass are soft-delete-less today — `DimUser`/`DimGroup` have no delete endpoint yet, per `tofix.md`. Leave test rows or clean up directly via DB if it bothers you.)

---

## What "good error handling" means here — checklist

- [ ] Every `401` case returns Shape B with `errorCode: "UNAUTHORIZED"`, not a raw Express error page.
- [ ] Every `403` case is a real boundary/role violation, not a stray `500`.
- [ ] Every `404` case names the specific missing resource (`BENEFIT_NOT_FOUND`, `REQUIREMENT_NOT_FOUND`, etc), not a generic message.
- [ ] Zod validation failures are `400` with `errorCode: "VALIDATION_ERROR"` and a field-specific `error` message, not `500`.
- [ ] No response ever contains `passHash`.
- [ ] No response ever contains a raw `BigInt` (would crash `JSON.stringify` — attachments must show `fileSize` as a string).
- [ ] Duplicate unique-constraint hits (username/email, benefitId+psgcCode, benefitId+groupId) come back as `409`, not `500`.
- [ ] Deleted rows never reappear in list endpoints or `GET :id` lookups.
