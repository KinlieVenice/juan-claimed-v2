# API Docs — Fields Domain

Base URL: `/api`. All responses use this envelope:

```json
{ "success": boolean, "message": string, "error": string | null, "errorCode": string | null, "data": any }
```

Auth: routes marked **Auth** require `mockAuth` (`Authorization: Bearer <jwt>`, or dev-only `x-user-id: <userId>` header when `NODE_ENV != production`) + `requireRole([...])`. Unmarked routes have no auth middleware.

---

## Fields — `/api/fields`

### GET `/api/fields`
List all fields. No payload. `data`: `DimField[]`.

### GET `/api/fields/:id`
`data`: `DimField`. 404 `FIELD_NOT_FOUND` if missing.

### POST `/api/fields`
Create a field, bundled with its options / dynamic condition tree / an inline-created hierarchy — one field at a time.

Request body:

| Field | Type | Required |
|---|---|---|
| `field.englishName` | string | required |
| `field.tagalogName` | string | required |
| `field.description` | string | required |
| `field.classification` | `"GLOBAL"` \| `"FOLLOW_UP"` | required |
| `field.default` | boolean | required |
| `field.required` | boolean | required |
| `field.sortOrder` | number (int) | required |
| `field.configJson` | object \| null | required |
| `field.fieldInputTypeId` | string | required |
| `field.parentFieldId` | string \| null | required |
| `field.fieldHierarchyId` | string \| null | required — reuse an existing hierarchy by id (omit/null if using `hierarchy` below) |
| `options` | array | optional — bulk create; each item: `{ englishName, tagalogName, englishDescription, tagalogDescription, sortOrder? }` |
| `dynamicCondition` | object | optional — AND/OR tree, see [Dynamic Rule Groups](#dynamic-rule-groups--apidynamic-rule-groups) body shape |
| `hierarchy` | object | optional — create a **new** hierarchy inline: `{ englishName, tagalogName, englishDescription, tagalogDescription, levels: [{level, englishName, tagalogName, englishDescription, tagalogDescription}] }` |
| `hierarchyNodes` | array | optional — nodes for the inline `hierarchy`; each: `{ englishName, tagalogName, englishDescription, tagalogDescription, sortOrder?, children?: [...] }` (recursive) |

`data`: `DimField & { options: DimFieldOption[], dynamicCondition: RuleGroupTree }`.

Errors: `DUPLICATE_KEY`(409), `INVALID_FOREIGN_KEY`(400), `NESTED_REPEATER_GROUP_NOT_ALLOWED`(400), `DUPLICATE_HIERARCHY`(409), `DUPLICATE_OPTION_VALUE`(409), `OPERATOR_NOT_FOUND`(400), `OPERATOR_INPUT_TYPE_MISMATCH`(400).

### PUT `/api/fields/:id`
Same body shape as POST. `options` items with an `id` are edited in place; items without `id` are created new. `dynamicCondition` (if given) wholesale-replaces the field's existing tree. `hierarchy` (if given) always creates a **new** hierarchy and re-points the field at it.

Errors: as POST, plus `FIELD_NOT_FOUND`(404), `DYNAMIC_RULE_GROUP_NOT_ALLOWED_FOR_REPEATER_SUBFIELD`(409), `FIELD_OPTION_NOT_FOUND`(404).

### DELETE `/api/fields/:id`
No payload. `data`: `{ id }`. 404 `FIELD_NOT_FOUND`.

---

## Field Options — `/api/fields/:fieldId/options`

### GET `/api/fields/:fieldId/options`
`data`: `DimFieldOption[]`.

### POST `/api/fields/:fieldId/options`
Bulk create.

| Field | Type | Required |
|---|---|---|
| `options` | array | required |
| `options[].englishName` | string | required |
| `options[].tagalogName` | string | required |
| `options[].englishDescription` | string | required |
| `options[].tagalogDescription` | string | required |
| `options[].sortOrder` | number (int) | optional |

`data`: `DimFieldOption[]`. Errors: `DUPLICATE_OPTION_VALUE`(409), `INVALID_FOREIGN_KEY`(400).

### PUT `/api/fields/:fieldId/options`
Bulk edit — same shape as POST but each item also requires `id` (string, required). `data`: `DimFieldOption[]`. Errors: `FIELD_OPTION_NOT_FOUND`(404), `DUPLICATE_OPTION_VALUE`(409), `INVALID_FOREIGN_KEY`(400).

No DELETE endpoint (not built).

---

## Field Hierarchies — `/api/field-hierarchies`

### GET `/api/field-hierarchies`
List all, with levels (no nodes). `data`: `(DimFieldHierarchy & { fieldHierarchyLevels: DimFieldHierarchyLevel[] })[]`.

### GET `/api/field-hierarchies/:id`
Full detail with levels + nodes. `data`: `DimFieldHierarchy & { fieldHierarchyLevels: [...], fieldHierarchyNodes: [...] }`. 404 `HIERARCHY_NOT_FOUND`.

### POST `/api/field-hierarchies`
Create hierarchy + levels + nodes in one call.

| Field | Type | Required |
|---|---|---|
| `englishName` | string | required |
| `tagalogName` | string | required |
| `englishDescription` | string | required |
| `tagalogDescription` | string | required |
| `levels` | array | required (may be empty `[]`) |
| `levels[].level` | number (int) | required |
| `levels[].englishName` | string | required |
| `levels[].tagalogName` | string | required |
| `levels[].englishDescription` | string | required |
| `levels[].tagalogDescription` | string | required |
| `nodes` | array | required (may be empty `[]`) |
| `nodes[].englishName` | string | required |
| `nodes[].tagalogName` | string | required |
| `nodes[].englishDescription` | string | required |
| `nodes[].tagalogDescription` | string | required |
| `nodes[].sortOrder` | number (int) | optional |
| `nodes[].children` | array (same shape, recursive) | optional |

`data`: full hierarchy (same shape as GET `:id`). Errors: `DUPLICATE_HIERARCHY`(409), `DUPLICATE_HIERARCHY_LEVEL`(409), `DUPLICATE_HIERARCHY_NODE`(409), `PARENT_NODE_NOT_FOUND`(400).

### POST `/api/field-hierarchies/:id/levels`
Granular bulk create. Body: `{ levels: [...] }` (same `levels[]` shape as above). `data`: `DimFieldHierarchyLevel[]`. Errors: `HIERARCHY_NOT_FOUND`(404), `DUPLICATE_HIERARCHY_LEVEL`(409).

### PUT `/api/field-hierarchies/:id/levels`
Body: `{ levels: [...] }`, each item also requires `id` (string, required). `data`: `DimFieldHierarchyLevel[]`. Errors: `HIERARCHY_NOT_FOUND`(404), `HIERARCHY_LEVEL_NOT_FOUND`(404), `DUPLICATE_HIERARCHY_LEVEL`(409).

### POST `/api/field-hierarchies/:id/nodes`
Granular bulk create. Body: `{ nodes: [...] }` (same `nodes[]` shape as POST hierarchy, recursive `children` supported). `data`: `DimFieldHierarchyNode[]` (full node list for the hierarchy). Errors: `HIERARCHY_NOT_FOUND`(404), `DUPLICATE_HIERARCHY_NODE`(409), `PARENT_NODE_NOT_FOUND`(400).

### PUT `/api/field-hierarchies/:id/nodes`
Body: `{ nodes: [...] }`, each item flat (no `children` — structure isn't editable this way) and requires `id` (string, required), plus `englishName`, `tagalogName`, `englishDescription`, `tagalogDescription` (all required), `sortOrder` (optional). `data`: `DimFieldHierarchyNode[]`. Errors: `HIERARCHY_NOT_FOUND`(404), `HIERARCHY_NODE_NOT_FOUND`(404), `DUPLICATE_HIERARCHY_NODE`(409).

No DELETE endpoints, no top-level hierarchy rename endpoint (not built).

---

## Dynamic Rule Groups — `/api/dynamic-rule-groups`

A field's own condition tree (checks that field's own answer against a predicate — see caveat below).

### GET `/api/dynamic-rule-groups/field/:fieldId`
`data`: `RuleGroupTree` (array of root groups — normally 0 or 1).

### POST `/api/dynamic-rule-groups/field/:fieldId`
Create the whole AND/OR tree in one call.

| Field | Type | Required |
|---|---|---|
| `kind` | `"group"` | required |
| `logicalOperator` | `"ALL"` \| `"ANY"` | required |
| `children` | array of nodes | required (may be empty `[]`) |

Each child node is either:
- `{ kind: "group", logicalOperator: "ALL"|"ANY", children: [...] }` (nested group), or
- `{ kind: "condition", fieldConditionOperatorId: string, conditionFieldValue: unknown }` (leaf)

`data`: `RuleGroupTree`. Errors: `FIELD_NOT_FOUND`(404), `DYNAMIC_RULE_GROUP_NOT_ALLOWED_FOR_REPEATER_SUBFIELD`(400), `OPERATOR_NOT_FOUND`(400), `OPERATOR_INPUT_TYPE_MISMATCH`(400).

### PUT `/api/dynamic-rule-groups/field/:fieldId`
Same body as POST. Wholesale-replaces the field's existing tree. Same errors as POST.

> **Caveat**: a field's own tree can only ever check *that same field's* answer (every leaf resolves to the tree's own `fieldId`), not a different field. In the current data, every existing dynamic rule group is actually a benefit-eligibility threshold wrapper (via `DimBenefitFieldCondition`), not a field-visibility condition — there is no cross-field "field B visible when field A = X" mechanism built anywhere yet.

---

## Field Lookups (read-only) — `/api`

### GET `/api/field-input-types`
`data`: `DimFieldInputType[]` (`id`, `englishName`, `tagalogName`, `value`, ...).

### GET `/api/field-condition-operators`
Query: `?fieldInputTypeId=<id>` (optional — omit for all). `data`: `DimFieldConditionOperator[]`.

---

## Field Answers — `/api/field-answers`

All routes: **Auth** (`mockAuth` + `requireRole(PARTICIPATE)` — any authenticated role). Self-service only: `userId` always comes from the session, never the request body.

### GET `/api/field-answers`
List the current user's answers. No payload. `data`: `{ id, fieldId, repeaterGroupId, value, createdAt, updatedAt }[]` (`value` decoded to its native type).

### PUT `/api/field-answers`
Bulk upsert (create-or-update per field).

| Field | Type | Required |
|---|---|---|
| `answers` | array | required |
| `answers[].fieldId` | string | required |
| `answers[].value` | any (shape depends on the field's input type) | required |
| `answers[].repeaterGroupId` | string \| null | required **if** the field is a REPEATER_GROUP subfield (must reference a group from `POST /groups`); must be omitted otherwise |

`data`: full updated answer list (same shape as GET). Errors: `FIELD_NOT_FOUND`(404), `FIELD_NOT_ANSWERABLE`(400, answering a REPEATER_GROUP field directly), `ANSWER_GROUP_REQUIRED`(400), `ANSWER_GROUP_NOT_ALLOWED`(400), `ANSWER_GROUP_NOT_FOUND`(404), `ANSWER_GROUP_FIELD_MISMATCH`(400), `INVALID_ANSWER_VALUE`(400, value doesn't match the field's input type / isn't a real option or hierarchy node).

### POST `/api/field-answers/groups`
Create a new repeater "row" instance (e.g. one dependent).

| Field | Type | Required |
|---|---|---|
| `fieldId` | string | required — must be a top-level REPEATER_GROUP field |

`data`: `FctUserFieldAnswerGroup` (`id`, `userId`, `fieldId`, `sortOrder`, ...). Errors: `FIELD_NOT_FOUND`(404), `REPEATER_GROUP_REQUIRED`(400).

### GET `/api/field-answers/groups/:fieldId`
List the current user's row-instances for that repeater field, ordered. No payload. `data`: `FctUserFieldAnswerGroup[]`.

No DELETE endpoints (not built).

---

## Rule Groups (read-only reference) — `/api/rule-groups`

### GET `/api/rule-groups/benefits/:id`
Full eligibility rule tree for a benefit. `data`: `RuleGroupTree`.

### GET `/api/rule-groups/fields/:id`
Same as `GET /api/dynamic-rule-groups/field/:id`, different route. `data`: `RuleGroupTree`.
