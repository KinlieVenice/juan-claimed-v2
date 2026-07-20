/*
  Warnings:

  - You are about to drop the column `fieldConditionId` on the `fct_dynamic_field_condition` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "fct_dynamic_field_condition" DROP CONSTRAINT "fct_dynamic_field_condition_fieldConditionId_fkey";

-- AlterTable
ALTER TABLE "fct_dynamic_field_condition" DROP COLUMN "fieldConditionId",
ADD COLUMN     "conditionFieldId" TEXT;

-- AddForeignKey
ALTER TABLE "fct_dynamic_field_condition" ADD CONSTRAINT "fct_dynamic_field_condition_conditionFieldId_fkey" FOREIGN KEY ("conditionFieldId") REFERENCES "dim_field"("id") ON DELETE SET NULL ON UPDATE CASCADE;
