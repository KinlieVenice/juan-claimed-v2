import { prisma, Prisma, type DbClient } from "../utils/prisma.js";
import { buildRuleGroupTree } from "../utils/treeBuilder.util.js";
import { matchRuleGroupTree } from "../utils/ruleGroupMatcher.util.js";

type LogicalOperator = "ALL" | "ANY";

// A single AND/OR tree submitted in one shot from a "big modal" — mirrors
// prisma/data/mock.benefits.data.ts's RuleNode shape. Root must be a group (a field's
// dynamic condition is never attached directly to a bare leaf condition).
export type DynamicRuleTreeNode =
  | { kind: "group"; logicalOperator: LogicalOperator; children: DynamicRuleTreeNode[] }
  | { kind: "condition"; fieldConditionOperatorId: string; conditionFieldValue: unknown };

export type DynamicRuleTreeRoot = Extract<DynamicRuleTreeNode, { kind: "group" }>;

// FETCH DYNAMIC RULE GROUP TREE — "With" variant takes an explicit db client so it can
// participate in a caller's own transaction, same pattern as every other service's bulk
// "...With(db, ...)" functions.
export const fetchDynamicRuleGroupTreeWith = async (db: DbClient, fieldId: string) => {
  const allGroups = await db.fctDynamicRuleGroup.findMany({
    where: { fieldId },
    include: { field: { include: { fieldInputType: true } } },
  });

  const groupIds = allGroups.map((g) => g.id);

  const allConditions = await db.fctDynamicFieldCondition.findMany({
    where: { dynamicRuleGroupId: { in: groupIds } },
    include: { fieldConditionOperator: true },
  });

  return buildRuleGroupTree(allGroups, allConditions, "dynamicRuleGroupId");
};

export const fetchDynamicRuleGroupTree = async (fieldId: string) => {
  return await fetchDynamicRuleGroupTreeWith(prisma, fieldId);
};

// answers: a resolved map of fieldId -> the applicant's actual answer value (already
// coerced into the shape condition.util.ts's compare() expects for that field's inputType).
export const evaluateDynamicFieldConditionWith = async (db: DbClient, fieldId: string, answers: Record<string, unknown>): Promise<boolean> => {
  const tree = await fetchDynamicRuleGroupTreeWith(db, fieldId);

  return matchRuleGroupTree(tree, answers, (leaf, group) => ({
    fieldId: group.field.id,
    inputType: group.field.fieldInputType.value,
    operator: leaf.fieldConditionOperator.value,
    targetValue: leaf.conditionFieldValue,
  }));
};

export const evaluateDynamicFieldCondition = async (fieldId: string, answers: Record<string, unknown>): Promise<boolean> => {
  return await evaluateDynamicFieldConditionWith(prisma, fieldId, answers);
};

// A dynamic rule group's field must exist and must NOT be a repeater subfield — a
// dynamic condition's "which row?" is ambiguous for a subfield unless the caller
// row-scopes it, which isn't supported yet (mirrors field.service.ts's
// assertNoDynamicRuleGroupForSubfield, checked from the other direction: that one
// blocks turning an existing field with a dynamic rule group INTO a subfield; this
// one blocks creating a dynamic rule group FOR an existing subfield).
const assertFieldCanHaveDynamicRuleGroup = async (fieldId: string, db: DbClient) => {
  const field = await db.dimField.findUnique({ where: { id: fieldId } });

  if (!field) {
    console.error(`[DynamicRuleGroupService] Field "${fieldId}" does not exist.`);
    throw new Error("FIELD_NOT_FOUND");
  }

  if (field.parentFieldId !== null) {
    console.error(`[DynamicRuleGroupService] Field "${fieldId}" is a repeater subfield and cannot have a dynamic rule group.`);
    throw new Error("DYNAMIC_RULE_GROUP_NOT_ALLOWED_FOR_REPEATER_SUBFIELD");
  }

  return field;
};

// Recursively creates one tree node. A "group" node creates a FctDynamicRuleGroup and
// recurses into its children; a "condition" node attaches a FctDynamicFieldCondition
// DIRECTLY to the enclosing group (parentRuleGroupId here is that group's id) — matches
// how fetchDynamicRuleGroupTree/buildRuleGroupTree already reads both leaf conditions and
// nested subgroups out of the same parent group's children, no per-leaf wrapper group needed.
const buildDynamicRuleTree = async (
  fieldId: string,
  fieldInputTypeId: string,
  parentRuleGroupId: string | null,
  node: DynamicRuleTreeNode,
  db: DbClient,
): Promise<void> => {
  if (node.kind === "group") {
    const group = await db.fctDynamicRuleGroup.create({
      data: { fieldId, parentRuleGroupId, logicalOperator: node.logicalOperator },
    });

    for (const child of node.children) {
      await buildDynamicRuleTree(fieldId, fieldInputTypeId, group.id, child, db);
    }
    return;
  }

  if (parentRuleGroupId === null) {
    throw new Error("A condition leaf must be inside a group.");
  }

  const operator = await db.dimFieldConditionOperator.findUnique({ where: { id: node.fieldConditionOperatorId } });
  if (!operator) {
    console.error(`[DynamicRuleGroupService] Field condition operator "${node.fieldConditionOperatorId}" does not exist.`);
    throw new Error("OPERATOR_NOT_FOUND");
  }

  // Catches configuring, say, an AGE_LESS_THAN (DATE) operator onto a TEXT field —
  // compare() would reject that combination at evaluation time anyway; better to
  // reject it here, at authoring time.
  if (operator.fieldInputTypeId !== fieldInputTypeId) {
    console.error(`[DynamicRuleGroupService] Operator "${node.fieldConditionOperatorId}" does not match field "${fieldId}"'s input type.`);
    throw new Error("OPERATOR_INPUT_TYPE_MISMATCH");
  }

  await db.fctDynamicFieldCondition.create({
    data: {
      dynamicRuleGroupId: parentRuleGroupId,
      fieldConditionOperatorId: node.fieldConditionOperatorId,
      conditionFieldValue: node.conditionFieldValue as Prisma.InputJsonValue,
    },
  });
};

// CREATE DYNAMIC RULE GROUP TREE (bulk — the whole AND/OR tree in one call/transaction).
// "With" variant takes an explicit db client so it can participate in a caller's own
// transaction (see field.service.ts's composite create/edit).
export const createDynamicRuleGroupTreeWith = async (db: DbClient, fieldId: string, tree: DynamicRuleTreeRoot) => {
  const field = await assertFieldCanHaveDynamicRuleGroup(fieldId, db);
  await buildDynamicRuleTree(fieldId, field.fieldInputTypeId, null, tree, db);
};

export const createDynamicRuleGroupTree = async (fieldId: string, tree: DynamicRuleTreeRoot) => {
  await prisma.$transaction((tx) => createDynamicRuleGroupTreeWith(tx, fieldId, tree));
  return await fetchDynamicRuleGroupTree(fieldId);
};

// EDIT DYNAMIC RULE GROUP TREE (bulk — wholesale replace: delete the field's existing
// tree, then rebuild fresh from the submitted one. Simpler and far more robust than
// diffing an arbitrary nested AND/OR structure to figure out what changed. If any part of
// the old tree is still referenced elsewhere (e.g. wrapped into a benefit's eligibility
// rule via DimBenefitFieldCondition), the delete step's FK violation rolls back the whole
// transaction — nothing is left half-replaced.
export const editDynamicRuleGroupTreeWith = async (db: DbClient, fieldId: string, tree: DynamicRuleTreeRoot) => {
  const field = await assertFieldCanHaveDynamicRuleGroup(fieldId, db);

  const existingGroups = await db.fctDynamicRuleGroup.findMany({ where: { fieldId }, select: { id: true } });
  const groupIds = existingGroups.map((g) => g.id);

  if (groupIds.length > 0) {
    await db.fctDynamicFieldCondition.deleteMany({ where: { dynamicRuleGroupId: { in: groupIds } } });
    await db.fctDynamicRuleGroup.deleteMany({ where: { id: { in: groupIds } } });
  }

  await buildDynamicRuleTree(fieldId, field.fieldInputTypeId, null, tree, db);
};

export const editDynamicRuleGroupTree = async (fieldId: string, tree: DynamicRuleTreeRoot) => {
  await prisma.$transaction((tx) => editDynamicRuleGroupTreeWith(tx, fieldId, tree));
  return await fetchDynamicRuleGroupTree(fieldId);
};
