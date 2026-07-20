-- Stable, hardcoded identifier (e.g. "PH_LOCATION") the frontend special-cases by name to
-- swap in a live-API-backed hierarchy picker instead of the generic static-node one. Null
-- for every regular admin-authored hierarchy — safe to add as nullable+unique with existing
-- rows (they all get NULL, and NULL is exempt from uniqueness in Postgres).
ALTER TABLE "dim_field_hierarchy" ADD COLUMN "key" VARCHAR(255);

CREATE UNIQUE INDEX "dim_field_hierarchy_key_key" ON "dim_field_hierarchy"("key");
