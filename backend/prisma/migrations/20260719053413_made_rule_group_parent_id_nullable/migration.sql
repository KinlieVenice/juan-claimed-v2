/*
  Warnings:

  - You are about to drop the `dim_input_type` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "dim_field" DROP CONSTRAINT "dim_field_fieldInputTypeId_fkey";

-- DropForeignKey
ALTER TABLE "dim_field_condition_operator" DROP CONSTRAINT "dim_field_condition_operator_fieldInputTypeId_fkey";

-- DropForeignKey
ALTER TABLE "dim_input_type" DROP CONSTRAINT "dim_input_type_createdById_fkey";

-- DropForeignKey
ALTER TABLE "dim_input_type" DROP CONSTRAINT "dim_input_type_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "fct_benefit_rule_group" DROP CONSTRAINT "fct_benefit_rule_group_parentRuleGroupId_fkey";

-- DropForeignKey
ALTER TABLE "fct_dynamic_rule_group" DROP CONSTRAINT "fct_dynamic_rule_group_parentRuleGroupId_fkey";

-- AlterTable
ALTER TABLE "fct_benefit_rule_group" ALTER COLUMN "parentRuleGroupId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "fct_dynamic_rule_group" ALTER COLUMN "parentRuleGroupId" DROP NOT NULL;

-- DropTable
DROP TABLE "dim_input_type";

-- CreateTable
CREATE TABLE "dim_field_input_type" (
    "id" TEXT NOT NULL,
    "englishName" VARCHAR(255) NOT NULL,
    "tagalogName" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dim_field_input_type_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dim_field_input_type_value_key" ON "dim_field_input_type"("value");

-- AddForeignKey
ALTER TABLE "fct_benefit_rule_group" ADD CONSTRAINT "fct_benefit_rule_group_parentRuleGroupId_fkey" FOREIGN KEY ("parentRuleGroupId") REFERENCES "fct_benefit_rule_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_dynamic_rule_group" ADD CONSTRAINT "fct_dynamic_rule_group_parentRuleGroupId_fkey" FOREIGN KEY ("parentRuleGroupId") REFERENCES "fct_dynamic_rule_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field" ADD CONSTRAINT "dim_field_fieldInputTypeId_fkey" FOREIGN KEY ("fieldInputTypeId") REFERENCES "dim_field_input_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_input_type" ADD CONSTRAINT "dim_field_input_type_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_input_type" ADD CONSTRAINT "dim_field_input_type_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_condition_operator" ADD CONSTRAINT "dim_field_condition_operator_fieldInputTypeId_fkey" FOREIGN KEY ("fieldInputTypeId") REFERENCES "dim_field_input_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
