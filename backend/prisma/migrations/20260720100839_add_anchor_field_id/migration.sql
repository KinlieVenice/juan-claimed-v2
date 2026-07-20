-- AlterTable
ALTER TABLE "dim_field" ADD COLUMN     "anchorFieldId" TEXT;

-- AddForeignKey
ALTER TABLE "dim_field" ADD CONSTRAINT "dim_field_anchorFieldId_fkey" FOREIGN KEY ("anchorFieldId") REFERENCES "dim_field"("id") ON DELETE SET NULL ON UPDATE CASCADE;
