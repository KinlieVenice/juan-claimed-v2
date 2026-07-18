/*
  Warnings:

  - You are about to drop the `FctBenefitRuleGroup` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FctDynamicRuleGroup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FctBenefitRuleGroup" DROP CONSTRAINT "FctBenefitRuleGroup_benefitId_fkey";

-- DropForeignKey
ALTER TABLE "FctBenefitRuleGroup" DROP CONSTRAINT "FctBenefitRuleGroup_parentRuleGroupId_fkey";

-- DropForeignKey
ALTER TABLE "FctDynamicRuleGroup" DROP CONSTRAINT "FctDynamicRuleGroup_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "FctDynamicRuleGroup" DROP CONSTRAINT "FctDynamicRuleGroup_parentRuleGroupId_fkey";

-- DropForeignKey
ALTER TABLE "benefit_field_condition" DROP CONSTRAINT "benefit_field_condition_benefitRuleGroupId_fkey";

-- DropForeignKey
ALTER TABLE "benefit_field_condition" DROP CONSTRAINT "benefit_field_condition_fctDynamicRuleGroupId_fkey";

-- DropForeignKey
ALTER TABLE "fct_dynamic_field_condition" DROP CONSTRAINT "fct_dynamic_field_condition_dynamicRuleGroupId_fkey";

-- DropTable
DROP TABLE "FctBenefitRuleGroup";

-- DropTable
DROP TABLE "FctDynamicRuleGroup";

-- CreateTable
CREATE TABLE "fct_benefit_rule_group" (
    "id" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "parentRuleGroupId" TEXT NOT NULL,
    "logicalOperator" "RuleLogicalOperator" NOT NULL DEFAULT 'ALL',

    CONSTRAINT "fct_benefit_rule_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fct_dynamic_rule_group" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "parentRuleGroupId" TEXT NOT NULL,
    "logicalOperator" "RuleLogicalOperator" NOT NULL DEFAULT 'ALL',

    CONSTRAINT "fct_dynamic_rule_group_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "benefit_field_condition" ADD CONSTRAINT "benefit_field_condition_benefitRuleGroupId_fkey" FOREIGN KEY ("benefitRuleGroupId") REFERENCES "fct_benefit_rule_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_field_condition" ADD CONSTRAINT "benefit_field_condition_fctDynamicRuleGroupId_fkey" FOREIGN KEY ("fctDynamicRuleGroupId") REFERENCES "fct_dynamic_rule_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_benefit_rule_group" ADD CONSTRAINT "fct_benefit_rule_group_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "fct_benefit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_benefit_rule_group" ADD CONSTRAINT "fct_benefit_rule_group_parentRuleGroupId_fkey" FOREIGN KEY ("parentRuleGroupId") REFERENCES "fct_benefit_rule_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_dynamic_rule_group" ADD CONSTRAINT "fct_dynamic_rule_group_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "dim_field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_dynamic_rule_group" ADD CONSTRAINT "fct_dynamic_rule_group_parentRuleGroupId_fkey" FOREIGN KEY ("parentRuleGroupId") REFERENCES "fct_dynamic_rule_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_dynamic_field_condition" ADD CONSTRAINT "fct_dynamic_field_condition_dynamicRuleGroupId_fkey" FOREIGN KEY ("dynamicRuleGroupId") REFERENCES "fct_dynamic_rule_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
