-- The same operator value (e.g. "EQUALS") is legitimately reused across many input types
-- (TEXT, NUMBER, SINGLE_SELECT, ...). A globally-unique `value` column meant
-- fieldConfigSeeder.ts's per-value upsert silently collapsed every input type's "EQUALS"
-- (etc.) into a single row, overwritten each time the seeder loop reached the next input
-- type with that same operator value — the last-processed input type "won" every value.
-- Unique per (value, fieldInputTypeId) instead.
DROP INDEX "dim_field_condition_operator_value_key";

CREATE UNIQUE INDEX "dim_field_condition_operator_value_fieldInputTypeId_key" ON "dim_field_condition_operator"("value", "fieldInputTypeId");
