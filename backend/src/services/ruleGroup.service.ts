import { prisma } from "../utils/prisma.js";
import { buildRuleGroupTree } from "../utils/treeBuilder.util.js";
import { matchRuleGroupTree } from "../utils/ruleGroupMatcher.util.js";

export const fetchBenefitRuleGroupTree = async (benefitId: string) => {
  const allGroups = await prisma.fctBenefitRuleGroup.findMany({
    where: { benefitId }
  });

  const groupIds = allGroups.map((g) => g.id);

  const allConditions = await prisma.dimBenefitFieldCondition.findMany({
    where: { benefitRuleGroupId: { in: groupIds } },
    include: {
      fieldConditionOperator: true,
      benefitFieldCondition: { include: { dynamicRuleGroup: { include: { field: { include: { fieldInputType: true } } } } } },
    },
  });

  return buildRuleGroupTree(allGroups, allConditions, "benefitRuleGroupId");
};

export const fetchDynamicRuleGroupTree = async (fieldId: string) => {
  const allGroups = await prisma.fctDynamicRuleGroup.findMany({
    where: { fieldId },
    include: { field: { include: { fieldInputType: true } } },
  });

  const groupIds = allGroups.map((g) => g.id);

  const allConditions = await prisma.fctDynamicFieldCondition.findMany({
    where: { dynamicRuleGroupId: { in: groupIds } },
    include: { fieldConditionOperator: true },
  });

  return buildRuleGroupTree(allGroups, allConditions, "dynamicRuleGroupId");
};

// answers: a resolved map of fieldId -> the applicant's actual answer value (already
// coerced into the shape condition.util.ts's compare() expects for that field's inputType).
export const evaluateBenefitEligibility = async (benefitId: string, answers: Record<string, unknown>): Promise<boolean> => {
  const tree = await fetchBenefitRuleGroupTree(benefitId);

  return matchRuleGroupTree(tree, answers, (leaf) => ({
    fieldId: leaf.benefitFieldCondition.dynamicRuleGroup.field.id,
    inputType: leaf.benefitFieldCondition.dynamicRuleGroup.field.fieldInputType.value,
    operator: leaf.fieldConditionOperator.value,
    targetValue: leaf.conditionFieldValue,
  }));
};

export const evaluateDynamicFieldCondition = async (fieldId: string, answers: Record<string, unknown>): Promise<boolean> => {
  const tree = await fetchDynamicRuleGroupTree(fieldId);

  return matchRuleGroupTree(tree, answers, (leaf, group) => ({
    fieldId: group.field.id,
    inputType: group.field.fieldInputType.value,
    operator: leaf.fieldConditionOperator.value,
    targetValue: leaf.conditionFieldValue,
  }));
};
