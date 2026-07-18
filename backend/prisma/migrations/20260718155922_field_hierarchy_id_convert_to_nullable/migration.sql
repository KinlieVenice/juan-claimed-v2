-- DropForeignKey
ALTER TABLE "dim_field" DROP CONSTRAINT "dim_field_fieldHierarchyId_fkey";

-- AlterTable
ALTER TABLE "dim_field" ALTER COLUMN "fieldHierarchyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "dim_field" ADD CONSTRAINT "dim_field_fieldHierarchyId_fkey" FOREIGN KEY ("fieldHierarchyId") REFERENCES "dim_field_hierarchy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
