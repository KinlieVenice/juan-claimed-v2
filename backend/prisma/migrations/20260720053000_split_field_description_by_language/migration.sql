-- Split DimField.description into englishDescription/tagalogDescription, matching every
-- other model in this schema (DimGroup, FctBenefit, DimFieldOption, DimFieldHierarchy, ...).
-- Written by hand (not `prisma migrate dev`) to safely backfill the 23 existing rows instead
-- of dropping data.

-- AlterTable: add the new columns nullable first so existing rows don't violate NOT NULL.
ALTER TABLE "dim_field" ADD COLUMN "englishDescription" TEXT;
ALTER TABLE "dim_field" ADD COLUMN "tagalogDescription" TEXT;

-- Backfill: no Tagalog translation existed before, so both columns start from the same
-- text every existing row already had.
UPDATE "dim_field" SET "englishDescription" = "description", "tagalogDescription" = "description";

-- Enforce NOT NULL now that every row is backfilled.
ALTER TABLE "dim_field" ALTER COLUMN "englishDescription" SET NOT NULL;
ALTER TABLE "dim_field" ALTER COLUMN "tagalogDescription" SET NOT NULL;

-- Drop the old single-language column.
ALTER TABLE "dim_field" DROP COLUMN "description";
