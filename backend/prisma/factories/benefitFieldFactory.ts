// factories/benefitFieldFactory.ts
// Standalone data-population script — NOT wired into prisma/seed.ts.
// Run manually: npx tsx prisma/factories/benefitFieldFactory.ts
//
// Populates: FctBenefit, DimField (incl. REPEATER_GROUP + children), DimFieldOption,
// DimFieldHierarchy/Level/Node, FctBenefitRuleGroup (nested AND/OR), FctDynamicRuleGroup,
// FctDynamicFieldCondition, DimBenefitFieldCondition.
//
// Reads DimFieldInputType / DimFieldConditionOperator from the DB — does not create or
// modify them (they're seeded separately via prisma/seeders/fieldConfigSeeder.ts).

import { prisma, Prisma } from "../../src/utils/prisma.js";
import { toSnakeCaseKey } from "../../src/utils/slug.util.js";
import { globalFields, benefits, type FieldDef, type RuleNode } from "../data/mock.benefits.data.js";
import { locationHierarchy, type HierarchyNodeDef } from "../data/mock.hierarchy.data.js";

const SCOPE_VALUES = ["NATIONAL", "REGION", "PROVINCE", "DISTRICT", "CITY", "MUNICIPALITY", "BARANGAY"] as const;

async function ensureScopes(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const value of SCOPE_VALUES) {
    const scope = await prisma.dimScope.upsert({
      where: { value },
      update: {},
      create: { value, name: value.charAt(0) + value.slice(1).toLowerCase() },
    });
    map[value] = scope.id;
  }
  return map;
}

async function loadInputTypeMap(): Promise<Record<string, string>> {
  const rows = await prisma.dimFieldInputType.findMany();
  return Object.fromEntries(rows.map((row) => [row.value, row.id]));
}

async function loadOperatorMap(): Promise<Record<string, string>> {
  const rows = await prisma.dimFieldConditionOperator.findMany();
  return Object.fromEntries(rows.map((row) => [row.value, row.id]));
}

async function ensureHierarchyNode(
  fieldHierarchyId: string,
  node: HierarchyNodeDef,
  parentNodeId: string | null,
  sortOrder: number,
): Promise<void> {
  const created = await prisma.dimFieldHierarchyNode.upsert({
    where: { fieldHierarchyId_value: { fieldHierarchyId, value: node.value } },
    update: {
      englishName: node.englishName,
      tagalogName: node.tagalogName,
      englishDescription: node.englishDescription,
      tagalogDescription: node.tagalogDescription,
      parentNodeId,
      sortOrder,
    },
    create: {
      fieldHierarchyId,
      value: node.value,
      englishName: node.englishName,
      tagalogName: node.tagalogName,
      englishDescription: node.englishDescription,
      tagalogDescription: node.tagalogDescription,
      parentNodeId,
      sortOrder,
    },
  });

  if (node.children) {
    for (const [index, child] of node.children.entries()) {
      await ensureHierarchyNode(fieldHierarchyId, child, created.id, index);
    }
  }
}

async function ensureHierarchy(): Promise<string> {
  let hierarchy = await prisma.dimFieldHierarchy.findFirst({ where: { englishName: locationHierarchy.englishName } });
  if (!hierarchy) {
    hierarchy = await prisma.dimFieldHierarchy.create({
      data: { englishName: locationHierarchy.englishName, tagalogName: locationHierarchy.tagalogName },
    });
  }

  for (const level of locationHierarchy.levels) {
    const existingLevel = await prisma.dimFieldHierarchyLevel.findFirst({
      where: { fieldHierarchyId: hierarchy.id, level: level.level },
    });
    if (!existingLevel) {
      await prisma.dimFieldHierarchyLevel.create({
        data: {
          fieldHierarchyId: hierarchy.id,
          level: level.level,
          englishName: level.englishName,
          tagalogName: level.tagalogName,
          englishDescription: level.englishDescription,
          tagalogDescription: level.tagalogDescription,
        },
      });
    }
  }

  for (const [index, node] of locationHierarchy.nodes.entries()) {
    await ensureHierarchyNode(hierarchy.id, node, null, index);
  }

  return hierarchy.id;
}

async function createField(
  def: FieldDef,
  defKeyPath: string,
  inputTypeMap: Record<string, string>,
  hierarchyId: string,
  parentFieldId: string | null,
  fieldIdMap: Record<string, string>,
): Promise<string> {
  const fieldInputTypeId = inputTypeMap[def.inputType];
  if (!fieldInputTypeId) {
    throw new Error(`Unknown inputType "${def.inputType}" for field "${defKeyPath}" — is it seeded in DimFieldInputType?`);
  }

  // key is the normalized (case/whitespace/separator-insensitive) form of englishName,
  // globally unique — see toSnakeCaseKey and schema.prisma's DimField comment. This means
  // englishName must be globally unique across every field (not just within one benefit),
  // unlike the old "<benefitSlug>.<fieldKey>" scheme.
  const key = toSnakeCaseKey(def.englishName);
  const fieldHierarchyId = def.hierarchy ? hierarchyId : null;

  const field = await prisma.dimField.upsert({
    where: { key },
    update: {
      key,
      englishName: def.englishName,
      tagalogName: def.tagalogName,
      description: def.description,
      fieldInputTypeId,
      fieldHierarchyId,
      parentFieldId,
      required: def.required ?? true,
      classification: def.classification ?? "GLOBAL",
    },
    create: {
      key,
      englishName: def.englishName,
      tagalogName: def.tagalogName,
      description: def.description,
      fieldInputTypeId,
      fieldHierarchyId,
      parentFieldId,
      required: def.required ?? true,
      classification: def.classification ?? "GLOBAL",
    },
  });

  if (def.options) {
    for (const [index, option] of def.options.entries()) {
      await prisma.dimFieldOption.upsert({
        where: { fieldId_value: { fieldId: field.id, value: option.value } },
        update: {
          englishName: option.englishName,
          tagalogName: option.tagalogName,
          englishDescription: option.englishDescription,
          tagalogDescription: option.tagalogDescription,
          sortOrder: index,
        },
        create: {
          fieldId: field.id,
          value: option.value,
          englishName: option.englishName,
          tagalogName: option.tagalogName,
          englishDescription: option.englishDescription,
          tagalogDescription: option.tagalogDescription,
          sortOrder: index,
        },
      });
    }
  }

  fieldIdMap[defKeyPath] = field.id;

  if (def.children) {
    if (def.inputType !== "REPEATER_GROUP") {
      throw new Error(`Field "${defKeyPath}" declares children but is not a REPEATER_GROUP.`);
    }
    for (const child of def.children) {
      // No nested repeater groups — a repeater's children must be plain fields.
      if (child.inputType === "REPEATER_GROUP" || child.children) {
        throw new Error(`Nested REPEATER_GROUP is not supported: "${defKeyPath}.${child.key}".`);
      }
      await createField(child, `${defKeyPath}.${child.key}`, inputTypeMap, hierarchyId, field.id, fieldIdMap);
    }
  }

  return field.id;
}

async function createRuleGroup(benefitId: string, parentId: string | null, logicalOperator: "ALL" | "ANY"): Promise<string> {
  // Root of the tree has no parent.
  const group = await prisma.fctBenefitRuleGroup.create({ data: { benefitId, parentRuleGroupId: parentId, logicalOperator } });
  return group.id;
}

async function attachCondition(
  benefitRuleGroupId: string,
  fieldId: string,
  fieldConditionOperatorId: string,
  conditionFieldValue: unknown,
  sortOrder: number,
): Promise<void> {
  // Every leaf condition is backed by its own single-node FctDynamicRuleGroup (root, no parent).
  const { id: dynamicRuleGroupId } = await prisma.fctDynamicRuleGroup.create({
    data: { fieldId, parentRuleGroupId: null, logicalOperator: "ALL" },
  });

  const dynamicFieldCondition = await prisma.fctDynamicFieldCondition.create({
    data: {
      dynamicRuleGroupId,
      fieldConditionOperatorId,
      conditionFieldValue: conditionFieldValue as Prisma.InputJsonValue,
    },
  });

  await prisma.dimBenefitFieldCondition.create({
    data: {
      benefitRuleGroupId,
      benefitFieldConditionId: dynamicFieldCondition.id,
      fieldConditionOperatorId,
      conditionFieldValue: conditionFieldValue as Prisma.InputJsonValue,
      sortOrder,
    },
  });
}

const REPEATER_MATCH_OPERATORS = new Set(["ANY_MATCH", "ALL_MATCH"]);

// Resolves fieldKey -> real DimField id inside a REPEATER_GROUP mini rule-group tree
// (RepeaterRuleNode[] from mock.benefits.data.ts), recursively, before persisting it
// as conditionFieldValue JSON.
function resolveRepeaterTreeFieldKeys(node: unknown, fieldIdMap: Record<string, string>): unknown {
  if (typeof node !== "object" || node === null) return node;

  if ("conditions" in node && Array.isArray((node as { conditions: unknown }).conditions)) {
    const group = node as { conditions: unknown[] };
    return { ...group, conditions: group.conditions.map((child) => resolveRepeaterTreeFieldKeys(child, fieldIdMap)) };
  }

  if ("fieldKey" in node) {
    const { fieldKey, ...rest } = node as { fieldKey: string; [key: string]: unknown };
    const fieldId = fieldIdMap[fieldKey];
    if (!fieldId) throw new Error(`Unknown fieldKey "${fieldKey}" referenced in repeater rule tree.`);
    return { ...rest, fieldId };
  }

  return node;
}

async function buildRuleTree(
  node: RuleNode,
  benefitId: string,
  parentGroupId: string | null,
  siblingIndex: number,
  fieldIdMap: Record<string, string>,
  operatorMap: Record<string, string>,
): Promise<void> {
  if (node.kind === "group") {
    const groupId = await createRuleGroup(benefitId, parentGroupId, node.logicalOperator);
    for (const [index, child] of node.children.entries()) {
      await buildRuleTree(child, benefitId, groupId, index, fieldIdMap, operatorMap);
    }
    return;
  }

  if (parentGroupId === null) {
    throw new Error("Condition leaf found without a parent rule group.");
  }

  const fieldId = fieldIdMap[node.fieldKey];
  if (!fieldId) throw new Error(`Unknown fieldKey "${node.fieldKey}" referenced in rule tree.`);

  const operatorId = operatorMap[node.operator];
  if (!operatorId) throw new Error(`Unknown operator "${node.operator}" referenced in rule tree for field "${node.fieldKey}".`);

  const conditionFieldValue =
    REPEATER_MATCH_OPERATORS.has(node.operator) && Array.isArray(node.value)
      ? node.value.map((n) => resolveRepeaterTreeFieldKeys(n, fieldIdMap))
      : node.value;

  await attachCondition(parentGroupId, fieldId, operatorId, conditionFieldValue, siblingIndex);
}

async function processBenefit(
  def: (typeof benefits)[number],
  scopeMap: Record<string, string>,
  inputTypeMap: Record<string, string>,
  operatorMap: Record<string, string>,
  hierarchyId: string,
  globalFieldIdMap: Record<string, string>,
): Promise<void> {
  let benefit = await prisma.fctBenefit.findFirst({ where: { name: def.name, deletedAt: null } });
  const isNew = !benefit;

  if (!benefit) {
    const scopeId = scopeMap[def.scopeValue];
    if (!scopeId) throw new Error(`Unknown scope "${def.scopeValue}" for benefit "${def.name}".`);

    benefit = await prisma.fctBenefit.create({
      data: {
        scopeId,
        name: def.name,
        englishDescription: def.englishDescription,
        tagalogDescription: def.tagalogDescription,
      },
    });
  }

  // Fields are always upserted (even on a re-run for an existing benefit) so field-def
  // changes (name/description/classification/etc.) stay in sync. Only the rule tree —
  // which can't be safely diffed/upserted — is skipped for benefits that already exist.
  const fieldIdMap: Record<string, string> = { ...globalFieldIdMap };
  for (const fieldDef of def.fields) {
    await createField(fieldDef, fieldDef.key, inputTypeMap, hierarchyId, null, fieldIdMap);
  }

  if (isNew) {
    await buildRuleTree(def.rule, benefit.id, null, 0, fieldIdMap, operatorMap);
    console.log(`  Created "${def.name}" (${def.fields.length} follow-up fields + ${Object.keys(globalFieldIdMap).length} global fields wired).`);
  } else {
    console.log(`  Refreshed fields for "${def.name}" (already exists — rule tree untouched).`);
  }
}

async function main() {
  console.log("Running benefit/field factory...");

  const [scopeMap, inputTypeMap, operatorMap] = await Promise.all([ensureScopes(), loadInputTypeMap(), loadOperatorMap()]);
  const hierarchyId = await ensureHierarchy();
  console.log("Scopes, input types, operators, and location hierarchy ready.");

  const globalFieldIdMap: Record<string, string> = {};
  for (const fieldDef of globalFields) {
    await createField(fieldDef, fieldDef.key, inputTypeMap, hierarchyId, null, globalFieldIdMap);
  }
  console.log(`Global fields ready (${Object.keys(globalFieldIdMap).length}).`);

  for (const benefitDef of benefits) {
    await processBenefit(benefitDef, scopeMap, inputTypeMap, operatorMap, hierarchyId, globalFieldIdMap);
  }

  console.log("Factory run complete.");
}

main()
  .catch((error) => {
    console.error("Factory run failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
