-- Adds DimField.notConditional (replaces the never-fully-wired PROFILE classification
-- concept: a field can stay classification=GLOBAL/FOLLOW_UP so it still loads/answers
-- normally, while notConditional=true excludes it from the field pickers used to build a
-- benefit's eligibility rule tree).
ALTER TABLE "dim_field" ADD COLUMN "notConditional" BOOLEAN NOT NULL DEFAULT false;

-- Drop the "PROFILE" value from FieldClassification (Postgres has no ALTER TYPE ... DROP
-- VALUE, so the type is recreated without it). Safe: no dim_field row currently uses it.
BEGIN;

ALTER TYPE "FieldClassification" RENAME TO "FieldClassification_old";

CREATE TYPE "FieldClassification" AS ENUM ('GLOBAL', 'FOLLOW_UP');

ALTER TABLE "dim_field"
  ALTER COLUMN "classification" DROP DEFAULT,
  ALTER COLUMN "classification" TYPE "FieldClassification" USING ("classification"::text::"FieldClassification"),
  ALTER COLUMN "classification" SET DEFAULT 'FOLLOW_UP';

DROP TYPE "FieldClassification_old";

COMMIT;
