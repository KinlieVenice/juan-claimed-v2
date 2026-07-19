# Condition `targetValue` / `actualValue` Shapes

Reference for `compare()` in [`src/utils/condition.util.ts`](../src/utils/condition.util.ts) — the pure, no-DB evaluator that checks an applicant's answer (`actualValue`) against a benefit's configured requirement (`targetValue`) for a given `inputType` + `operator` pair.

```ts
compare({ inputType, operator, targetValue, actualValue }): boolean
```

`inputType` and `operator` are the `.value` strings from `DimFieldInputType` / `DimFieldConditionOperator` (see `prisma/data/fieldConfig.ts` for the full seeded list). "not used" means the operator is unary — that side is ignored entirely (pass `null`).

All `INVALID_TARGET_VALUE` / `INVALID_ACTUAL_VALUE` throws mean the shape didn't match what the operator expects — treat as a 400-worthy client/data bug, not something to silently coerce.

---

## TEXT

Case-insensitive and trimmed on both sides.

| Operator | targetValue | actualValue |
|---|---|---|
| `EQUALS` / `NOT_EQUALS` | `string` | `string` |
| `STARTS_WITH` / `ENDS_WITH` / `CONTAINS_SUBSTRING` / `NOT_CONTAINS_SUBSTRING` | `string` | `string` |
| `IS_EMPTY` / `IS_NOT_EMPTY` | not used | `string` |

```ts
compare({ inputType: "TEXT", operator: "EQUALS", targetValue: "juan dela cruz", actualValue: "Juan Dela Cruz" }) // true
```

---

## NUMBER / MONEY

Unitless — no coercion from numeric strings on either side.

| Operator | targetValue | actualValue |
|---|---|---|
| `EQUALS` / `NOT_EQUALS` / `GREATER_THAN` / `LESS_THAN` / `GREATER_THAN_EQUAL` / `LESS_THAN_EQUAL` | `number` | `number` |
| `BETWEEN` | `{ min: number, max: number }` (inclusive) | `number` |

```ts
compare({ inputType: "MONEY", operator: "LESS_THAN_EQUAL", targetValue: 15000, actualValue: 12000 }) // true
compare({ inputType: "NUMBER", operator: "BETWEEN", targetValue: { min: 1, max: 10 }, actualValue: 5 }) // true
```

---

## DURATION

Both sides are raw `{ value, unit }` magnitudes — there's no anchor date to diff against, so cross-unit comparisons convert to a common day count using fixed approximations: `day=1, week=7, month=30, year=365` (not calendar-exact — see [Design Notes](#design-notes)).

| Operator | targetValue | actualValue |
|---|---|---|
| `EQUALS` / `NOT_EQUALS` / `GREATER_THAN` / `LESS_THAN` / `GREATER_THAN_EQUAL` / `LESS_THAN_EQUAL` | `{ value: number, unit: "days" \| "weeks" \| "months" \| "years" }` | `{ value: number, unit }` |
| `BETWEEN` | `{ min: number, max: number, unit }` (inclusive; `min`/`max` share one `unit`) | `{ value: number, unit }` |

```ts
// requirement: unemployed for more than 1 year; applicant answered "2 months"
compare({
  inputType: "DURATION",
  operator: "GREATER_THAN",
  targetValue: { value: 1, unit: "years" },
  actualValue: { value: 2, unit: "months" },
}) // false
```

---

## DATE

ISO date (`"2024-01-01"`) or datetime (`"2024-01-01T10:00:00Z"`) string on both sides, where used. Comparisons between two dated values auto-detect granularity — if either side has an explicit time component, comparison is millisecond-precise; if neither does, it's day-precise. **Mixing a date-only value with a datetime value throws `INVALID_TARGET_VALUE`** — the UI is expected to keep both sides the same shape.

| Operator | targetValue | actualValue | Notes |
|---|---|---|---|
| `BEFORE` / `AFTER` | date/datetime `string` | date/datetime `string` | |
| `EQUALS` / `ON_OR_BEFORE` / `ON_OR_AFTER` | date/datetime `string` | date/datetime `string` | granularity auto-detected |
| `BETWEEN` | `{ from: string, to: string }` | date/datetime `string` | inclusive; granularity auto-detected against `actualValue` |
| `IN_THE_PAST` / `IN_THE_FUTURE` | not used | date/datetime `string` | vs. server's current time |
| `IS_CURRENT_DAY` / `IS_CURRENT_WEEK` / `IS_CURRENT_MONTH` / `IS_CURRENT_YEAR` | not used | date/datetime `string` | is `actualValue` in the current day/week/month/year |

```ts
compare({ inputType: "DATE", operator: "BETWEEN", targetValue: { from: "2024-01-01", to: "2024-12-31" }, actualValue: "2024-06-15" }) // true
compare({ inputType: "DATE", operator: "IS_CURRENT_MONTH", targetValue: null, actualValue: "2026-07-05" }) // true if today is in July 2026
```

### DATE — age operators

`actualValue` is always a **birth date** (date/datetime string) for this whole group — the diff (`now - birthDate`) is computed live at evaluation time via `dayjs`, calendar-accurate per unit (correctly handles leap years / variable month lengths — not a flat day-count approximation like DURATION).

| Operator | targetValue | actualValue |
|---|---|---|
| `AGE_GREATER_THAN` / `AGE_LESS_THAN` / `AGE_GREATER_THAN_EQUAL` / `AGE_LESS_THAN_EQUAL` / `AGE_EQUALS` / `AGE_NOT_EQUALS` | `{ value: number, unit: "days" \| "months" \| "years" }` | birth date `string` |
| `AGE_BETWEEN` | `{ min: number, max: number, unit }` (inclusive; `min`/`max` share one `unit`) | birth date `string` |

```ts
// senior citizen benefit: 60 years old or older
compare({
  inputType: "DATE",
  operator: "AGE_GREATER_THAN_EQUAL",
  targetValue: { value: 60, unit: "years" },
  actualValue: "1960-03-15",
})

// working-age bracket: 18-59 years old
compare({
  inputType: "DATE",
  operator: "AGE_BETWEEN",
  targetValue: { min: 18, max: 59, unit: "years" },
  actualValue: "2000-01-01",
})
```

---

## BOOLEAN

| Operator | targetValue | actualValue |
|---|---|---|
| `EQUALS` | `boolean` | `boolean` |

---

## SINGLE_SELECT

Case-sensitive — option codes come from the seeded option list, not free text.

| Operator | targetValue | actualValue |
|---|---|---|
| `EQUALS` / `NOT_EQUALS` | `string` (option `.value`) | `string` (selected option `.value`) |

---

## MULTI_SELECT

Case-sensitive, same reasoning as SINGLE_SELECT.

| Operator | targetValue | actualValue | Notes |
|---|---|---|---|
| `EQUALS` / `NOT_EQUALS` | `string[]` | `string[]` e.g. `["PWD", "SENIOR"]` | set equality, order-independent |
| `IN` | `string[]` | `string[]` | true if any of `actualValue` is in `targetValue` |
| `NOT_IN` | `string[]` | `string[]` | true if none of `actualValue` is in `targetValue` |

---

## HIERARCHY_SELECT

| Operator | targetValue | actualValue |
|---|---|---|
| `EQUALS` / `NOT_EQUALS` | `string` (node value) | `string` (selected node value) |
| `IN` | `string[]` | `string` (selected node value) |
| `IS_EMPTY` / `IS_NOT_EMPTY` | not used | `string` (selected node value) |
| `BELONGS_TO` | `string` (ancestor node value) | `string[]` — selected node's **root-first ancestor path**, e.g. `["NCR", "Manila", "Ermita"]` |

```ts
compare({
  inputType: "HIERARCHY_SELECT",
  operator: "BELONGS_TO",
  targetValue: "Manila",
  actualValue: ["NCR", "Manila", "Ermita"],
}) // true
```

---

## REPEATER_GROUP

| Operator | targetValue | actualValue |
|---|---|---|
| `COUNT_EQUALS` / `SUM_GREATER_THAN` / `MIN_LESS_THAN` / `MAX_GREATER_THAN` / `AVERAGE_GREATER_THAN` | `number` | `number[]` — the row values already picked out by the caller |
| `ANY_MATCH` / `ALL_MATCH` | mini rule-group tree (see below) | `Array<Record<fieldId, value>>` — one entry per row, each a map of **child field id → that row's answer** |

**`ANY_MATCH`/`ALL_MATCH` `targetValue`** is a single-root AND/OR tree, the exact same shape `services/ruleGroup.service.ts` uses for benefit/dynamic condition trees — just embedded as JSON instead of DB rows:

```ts
targetValue: [
  {
    logicalOperator: "ALL" | "ANY",
    conditions: [
      { fieldId: string, inputType: string, operator: string, conditionFieldValue: unknown } // leaf
      // — or another nested { logicalOperator, conditions } group —
    ],
  },
]
```

Each leaf's `fieldId` is a lookup key into a row's answer map (`row[fieldId]`), `inputType`/`operator`/`conditionFieldValue` are then run through `compare()` exactly like a top-level condition. **`ALL_MATCH`**: every row must satisfy the tree. **`ANY_MATCH`**: at least one row must satisfy it. A row is evaluated against the *whole* tree — mixing multiple child fields with AND/OR within a single row is exactly what the tree is for (e.g. "row's `enrollmentStatus` is true AND (`gradeLevel` is `HIGH_SCHOOL` OR `gradeLevel` is `COLLEGE`)").

The REPEATER_GROUP field's own `actualValue` — if you tried to look it up as a single `FctUserFieldAnswer` row for that field id — doesn't exist; a repeater has no single scalar answer, since its data is distributed across its child fields, once per row. Building the `Array<Record<fieldId, value>>` shape from those distributed per-row, per-child-field answers is the caller's job (whatever resolves answers before calling `compare()`), not something `compare()` derives itself.

```ts
// at least one dependent is a minor
compare({
  inputType: "REPEATER_GROUP",
  operator: "ANY_MATCH",
  targetValue: [
    {
      logicalOperator: "ALL",
      conditions: [
        { fieldId: "dependent-birthdate-field-id", inputType: "DATE", operator: "AGE_LESS_THAN", conditionFieldValue: { value: 18, unit: "years" } },
      ],
    },
  ],
  actualValue: [
    { "dependent-birthdate-field-id": "1990-01-01" },
    { "dependent-birthdate-field-id": "2015-06-01" },
  ],
}) // true
```

---

## Design Notes

- **DURATION vs. DATE age operators — why they convert differently**: AGE operators have a real anchor date (`actualValue` is a birthdate), so the diff against "now" is computed live with `dayjs`, which is exact across leap years and variable month lengths. DURATION has no anchor date on either side — just two raw magnitudes — so there's nothing to diff against; converting `weeks`/`months`/`years` to a common day count necessarily uses fixed approximations (`month = 30 days`, `year = 365 days`).
- **Why type mismatches throw instead of coercing**: `targetValue`/`actualValue` ultimately originate from client-submitted request bodies. A shape mismatch against the field's configured `inputType` is treated as a client/data bug to reject (400), not something to guess at — silently coercing could hide a broken form config or a bypassed frontend, in either direction (wrongly granting *or* wrongly denying a benefit).
- **Case sensitivity**: TEXT is case-insensitive (free-typed government form input). SINGLE_SELECT/MULTI_SELECT/HIERARCHY_SELECT are case-sensitive (values come from your own seeded option lists, not free typing).
- **REPEATER_GROUP's mini-tree stays self-contained on purpose**: unlike the benefit/dynamic rule-group trees (which resolve `fieldId` → input type/operator via DB relations), a REPEATER_GROUP leaf carries `inputType` and `operator` directly in its own JSON rather than requiring `compare()` to look them up — `compare()` stays DB-free. Whatever persists this JSON (e.g. `prisma/factories/benefitFieldFactory.ts`) is responsible for resolving any human-authored field references (like a `fieldKey`) into the real `fieldId` before it's saved.
