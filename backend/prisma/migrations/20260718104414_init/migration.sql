-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'AGENT', 'USER');

-- CreateEnum
CREATE TYPE "RuleLogicalOperator" AS ENUM ('ALL', 'ANY');

-- CreateEnum
CREATE TYPE "FieldClassification" AS ENUM ('GLOBAL', 'FOLLOW_UP');

-- CreateTable
CREATE TABLE "dim_user" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(255) NOT NULL,
    "middleName" VARCHAR(255),
    "lastName" VARCHAR(255) NOT NULL,
    "passHash" VARCHAR(255),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "psgcCode" VARCHAR(255),
    "scopeId" TEXT,
    "groupId" VARCHAR(255),
    "googleId" VARCHAR(255),
    "avatarUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dim_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_scope" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dim_scope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_group" (
    "id" TEXT NOT NULL,
    "englishName" VARCHAR(255) NOT NULL,
    "tagalogName" VARCHAR(255) NOT NULL,
    "englishDescription" TEXT NOT NULL,
    "tagalogDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dim_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fct_benefit" (
    "id" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "englishDescription" TEXT NOT NULL,
    "tagalogDescription" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fct_benefit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_benefit_group" (
    "id" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "creator" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dim_benefit_group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_benefit_psgc_code" (
    "id" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "psgcCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dim_benefit_psgc_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fct_benefit_requirement" (
    "id" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "englishName" VARCHAR(255) NOT NULL,
    "tagalogName" VARCHAR(255) NOT NULL,
    "englishDescription" TEXT NOT NULL,
    "tagalogDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fct_benefit_requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fct_benefit_utilization" (
    "id" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "englishName" VARCHAR(255) NOT NULL,
    "tagalogName" VARCHAR(255) NOT NULL,
    "englishDescription" TEXT NOT NULL,
    "tagalogDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fct_benefit_utilization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fct_benefit_attachment" (
    "id" TEXT NOT NULL,
    "fileLabel" VARCHAR(255) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileType" VARCHAR(255) NOT NULL,
    "filePath" VARCHAR(255) NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "entityId" VARCHAR(255) NOT NULL,
    "entityType" VARCHAR(255) NOT NULL,
    "metaData" JSON NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fct_benefit_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefit_field_condition" (
    "id" TEXT NOT NULL,
    "benefitRuleGroupId" TEXT NOT NULL,
    "benefitFieldConditionId" TEXT NOT NULL,
    "fieldConditionOperatorId" TEXT NOT NULL,
    "conditionFieldValue" JSON NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),
    "fctDynamicRuleGroupId" TEXT,

    CONSTRAINT "benefit_field_condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FctBenefitRuleGroup" (
    "id" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "parentRuleGroupId" TEXT NOT NULL,
    "logicalOperator" "RuleLogicalOperator" NOT NULL DEFAULT 'ALL',

    CONSTRAINT "FctBenefitRuleGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FctDynamicRuleGroup" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "parentRuleGroupId" TEXT NOT NULL,
    "logicalOperator" "RuleLogicalOperator" NOT NULL DEFAULT 'ALL',

    CONSTRAINT "FctDynamicRuleGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_field" (
    "id" TEXT NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "parentFieldId" TEXT,
    "englishName" VARCHAR(255) NOT NULL,
    "tagalogName" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "fieldInputTypeId" TEXT NOT NULL,
    "fieldHierarchyId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "configJson" JSONB,
    "classfication" "FieldClassification" NOT NULL DEFAULT 'FOLLOW_UP',
    "default" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dim_field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_input_type" (
    "id" TEXT NOT NULL,
    "englishName" VARCHAR(255) NOT NULL,
    "tagalogName" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dim_input_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_field_option" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "englishName" VARCHAR(255) NOT NULL,
    "tagalogName" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "englishDescription" TEXT NOT NULL,
    "tagalogDescription" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dim_field_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_field_hierarchy" (
    "id" TEXT NOT NULL,
    "englishName" VARCHAR(255) NOT NULL,
    "tagalogName" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dim_field_hierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_field_hierarchy_level" (
    "id" TEXT NOT NULL,
    "fieldHierarchyId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "englishName" VARCHAR(255) NOT NULL,
    "tagalogName" VARCHAR(255) NOT NULL,
    "englishDescription" TEXT NOT NULL,
    "tagalogDescription" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dim_field_hierarchy_level_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_field_hierarchy_node" (
    "id" TEXT NOT NULL,
    "fieldHierarchyId" TEXT NOT NULL,
    "parentNodeId" TEXT,
    "englishName" VARCHAR(255) NOT NULL,
    "tagalogName" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "englishDescription" TEXT NOT NULL,
    "tagalogDescription" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dim_field_hierarchy_node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dim_field_condition_operator" (
    "id" TEXT NOT NULL,
    "englishName" VARCHAR(255) NOT NULL,
    "tagalogName" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "fieldInputTypeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "dim_field_condition_operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fct_user_field_answer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "field_value" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fct_user_field_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fct_dynamic_field_condition" (
    "id" TEXT NOT NULL,
    "dynamicRuleGroupId" TEXT NOT NULL,
    "fieldConditionOperatorId" TEXT NOT NULL,
    "fieldConditionId" TEXT,
    "conditionFieldValue" JSON NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" VARCHAR(255),
    "updatedById" VARCHAR(255),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "fct_dynamic_field_condition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dim_user_username_key" ON "dim_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "dim_user_email_key" ON "dim_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "dim_scope_value_key" ON "dim_scope"("value");

-- CreateIndex
CREATE INDEX "fct_benefit_deletedAt_idx" ON "fct_benefit"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "dim_benefit_group_benefitId_groupId_key" ON "dim_benefit_group"("benefitId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "dim_benefit_psgc_code_benefitId_psgcCode_key" ON "dim_benefit_psgc_code"("benefitId", "psgcCode");

-- CreateIndex
CREATE INDEX "fct_benefit_requirement_deletedAt_idx" ON "fct_benefit_requirement"("deletedAt");

-- CreateIndex
CREATE INDEX "fct_benefit_utilization_deletedAt_idx" ON "fct_benefit_utilization"("deletedAt");

-- CreateIndex
CREATE INDEX "fct_benefit_attachment_entityType_entityId_idx" ON "fct_benefit_attachment"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "dim_field_key_key" ON "dim_field"("key");

-- CreateIndex
CREATE UNIQUE INDEX "dim_input_type_value_key" ON "dim_input_type"("value");

-- CreateIndex
CREATE UNIQUE INDEX "dim_field_option_fieldId_value_key" ON "dim_field_option"("fieldId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "dim_field_hierarchy_node_fieldHierarchyId_value_key" ON "dim_field_hierarchy_node"("fieldHierarchyId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "dim_field_condition_operator_value_key" ON "dim_field_condition_operator"("value");

-- AddForeignKey
ALTER TABLE "dim_user" ADD CONSTRAINT "dim_user_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "dim_scope"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_user" ADD CONSTRAINT "dim_user_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "dim_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_user" ADD CONSTRAINT "dim_user_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_user" ADD CONSTRAINT "dim_user_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_scope" ADD CONSTRAINT "dim_scope_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_scope" ADD CONSTRAINT "dim_scope_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_group" ADD CONSTRAINT "dim_group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_group" ADD CONSTRAINT "dim_group_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_benefit" ADD CONSTRAINT "fct_benefit_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "dim_scope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_benefit" ADD CONSTRAINT "fct_benefit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_benefit" ADD CONSTRAINT "fct_benefit_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_benefit_group" ADD CONSTRAINT "dim_benefit_group_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "fct_benefit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_benefit_group" ADD CONSTRAINT "dim_benefit_group_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "dim_group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_benefit_group" ADD CONSTRAINT "dim_benefit_group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_benefit_group" ADD CONSTRAINT "dim_benefit_group_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_benefit_psgc_code" ADD CONSTRAINT "dim_benefit_psgc_code_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "fct_benefit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_benefit_psgc_code" ADD CONSTRAINT "dim_benefit_psgc_code_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "dim_scope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_benefit_psgc_code" ADD CONSTRAINT "dim_benefit_psgc_code_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_benefit_psgc_code" ADD CONSTRAINT "dim_benefit_psgc_code_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_benefit_requirement" ADD CONSTRAINT "fct_benefit_requirement_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "fct_benefit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_benefit_requirement" ADD CONSTRAINT "fct_benefit_requirement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_benefit_requirement" ADD CONSTRAINT "fct_benefit_requirement_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_benefit_utilization" ADD CONSTRAINT "fct_benefit_utilization_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "fct_benefit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_benefit_utilization" ADD CONSTRAINT "fct_benefit_utilization_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_benefit_utilization" ADD CONSTRAINT "fct_benefit_utilization_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_benefit_attachment" ADD CONSTRAINT "fct_benefit_attachment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_benefit_attachment" ADD CONSTRAINT "fct_benefit_attachment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_field_condition" ADD CONSTRAINT "benefit_field_condition_benefitRuleGroupId_fkey" FOREIGN KEY ("benefitRuleGroupId") REFERENCES "FctBenefitRuleGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_field_condition" ADD CONSTRAINT "benefit_field_condition_benefitFieldConditionId_fkey" FOREIGN KEY ("benefitFieldConditionId") REFERENCES "fct_dynamic_field_condition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_field_condition" ADD CONSTRAINT "benefit_field_condition_fieldConditionOperatorId_fkey" FOREIGN KEY ("fieldConditionOperatorId") REFERENCES "dim_field_condition_operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_field_condition" ADD CONSTRAINT "benefit_field_condition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_field_condition" ADD CONSTRAINT "benefit_field_condition_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_field_condition" ADD CONSTRAINT "benefit_field_condition_fctDynamicRuleGroupId_fkey" FOREIGN KEY ("fctDynamicRuleGroupId") REFERENCES "FctDynamicRuleGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FctBenefitRuleGroup" ADD CONSTRAINT "FctBenefitRuleGroup_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "fct_benefit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FctBenefitRuleGroup" ADD CONSTRAINT "FctBenefitRuleGroup_parentRuleGroupId_fkey" FOREIGN KEY ("parentRuleGroupId") REFERENCES "FctBenefitRuleGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FctDynamicRuleGroup" ADD CONSTRAINT "FctDynamicRuleGroup_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "dim_field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FctDynamicRuleGroup" ADD CONSTRAINT "FctDynamicRuleGroup_parentRuleGroupId_fkey" FOREIGN KEY ("parentRuleGroupId") REFERENCES "FctDynamicRuleGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field" ADD CONSTRAINT "dim_field_parentFieldId_fkey" FOREIGN KEY ("parentFieldId") REFERENCES "dim_field"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field" ADD CONSTRAINT "dim_field_fieldInputTypeId_fkey" FOREIGN KEY ("fieldInputTypeId") REFERENCES "dim_input_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field" ADD CONSTRAINT "dim_field_fieldHierarchyId_fkey" FOREIGN KEY ("fieldHierarchyId") REFERENCES "dim_field_hierarchy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field" ADD CONSTRAINT "dim_field_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field" ADD CONSTRAINT "dim_field_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_input_type" ADD CONSTRAINT "dim_input_type_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_input_type" ADD CONSTRAINT "dim_input_type_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_option" ADD CONSTRAINT "dim_field_option_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "dim_field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_option" ADD CONSTRAINT "dim_field_option_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_option" ADD CONSTRAINT "dim_field_option_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_hierarchy" ADD CONSTRAINT "dim_field_hierarchy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_hierarchy" ADD CONSTRAINT "dim_field_hierarchy_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_hierarchy_level" ADD CONSTRAINT "dim_field_hierarchy_level_fieldHierarchyId_fkey" FOREIGN KEY ("fieldHierarchyId") REFERENCES "dim_field_hierarchy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_hierarchy_level" ADD CONSTRAINT "dim_field_hierarchy_level_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_hierarchy_level" ADD CONSTRAINT "dim_field_hierarchy_level_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_hierarchy_node" ADD CONSTRAINT "dim_field_hierarchy_node_fieldHierarchyId_fkey" FOREIGN KEY ("fieldHierarchyId") REFERENCES "dim_field_hierarchy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_hierarchy_node" ADD CONSTRAINT "dim_field_hierarchy_node_parentNodeId_fkey" FOREIGN KEY ("parentNodeId") REFERENCES "dim_field_hierarchy_node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_hierarchy_node" ADD CONSTRAINT "dim_field_hierarchy_node_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_hierarchy_node" ADD CONSTRAINT "dim_field_hierarchy_node_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_condition_operator" ADD CONSTRAINT "dim_field_condition_operator_fieldInputTypeId_fkey" FOREIGN KEY ("fieldInputTypeId") REFERENCES "dim_input_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_condition_operator" ADD CONSTRAINT "dim_field_condition_operator_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dim_field_condition_operator" ADD CONSTRAINT "dim_field_condition_operator_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_user_field_answer" ADD CONSTRAINT "fct_user_field_answer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "dim_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_user_field_answer" ADD CONSTRAINT "fct_user_field_answer_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "dim_field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_user_field_answer" ADD CONSTRAINT "fct_user_field_answer_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_user_field_answer" ADD CONSTRAINT "fct_user_field_answer_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_dynamic_field_condition" ADD CONSTRAINT "fct_dynamic_field_condition_dynamicRuleGroupId_fkey" FOREIGN KEY ("dynamicRuleGroupId") REFERENCES "FctDynamicRuleGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_dynamic_field_condition" ADD CONSTRAINT "fct_dynamic_field_condition_fieldConditionOperatorId_fkey" FOREIGN KEY ("fieldConditionOperatorId") REFERENCES "dim_field_condition_operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_dynamic_field_condition" ADD CONSTRAINT "fct_dynamic_field_condition_fieldConditionId_fkey" FOREIGN KEY ("fieldConditionId") REFERENCES "benefit_field_condition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_dynamic_field_condition" ADD CONSTRAINT "fct_dynamic_field_condition_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fct_dynamic_field_condition" ADD CONSTRAINT "fct_dynamic_field_condition_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "dim_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
