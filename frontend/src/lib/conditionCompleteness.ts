// Shared "is this condition tree actually finished, not half-built" check — used at
// submit time by FieldFormModal.tsx (Parent Dependents / dynamicCondition), by anchored
// Children Dependents' single trigger condition, and by BenefitFormModal.tsx (eligibility
// tree). An empty ROOT group is fine (no conditioning at all is a valid, deliberate state —
// dynamicCondition null / an empty eligibility tree both mean "always applies"); an empty
// NESTED group is not (an admin added a group via "Add Group" and never filled it).
import type { DimFieldConditionOperator, FieldRuleTreeNode, RuleTreeNode } from "@/types/domain";

const PRESENCE_ONLY_OPERATORS = new Set(["IS_EMPTY", "IS_NOT_EMPTY"]);

// IS_EMPTY/IS_NOT_EMPTY need no target value at all (see ConditionValueInput.tsx). Otherwise
// null/undefined/""/[] all read as "not actually filled in yet" — 0/false are left alone
// since those are deliberate, meaningful values, not placeholders.
export function isConditionValueFilled(operatorValue: string, value: unknown): boolean {
  if (PRESENCE_ONLY_OPERATORS.has(operatorValue)) return true;
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return true;
}

export function isFieldConditionTreeComplete(node: FieldRuleTreeNode, isRoot = true): boolean {
  if (node.kind === "group") {
    if (node.children.length === 0) return isRoot;
    return node.children.every((child) => isFieldConditionTreeComplete(child, false));
  }
  return !!node.conditionFieldId && !!node.fieldConditionOperatorId && isConditionValueFilled(node.operatorValue, node.conditionFieldValue);
}

// Benefit eligibility leaves don't carry their own resolved operatorValue (unlike
// FieldRuleTreeNode) — resolved here from the operators list instead.
export function isBenefitRuleTreeComplete(node: RuleTreeNode, operators: DimFieldConditionOperator[], isRoot = true): boolean {
  if (node.kind === "group") {
    if (node.children.length === 0) return isRoot;
    return node.children.every((child) => isBenefitRuleTreeComplete(child, operators, false));
  }
  const operatorValue = operators.find((o) => o.id === node.fieldConditionOperatorId)?.value ?? "";
  return !!node.fieldId && !!node.fieldConditionOperatorId && isConditionValueFilled(operatorValue, node.conditionFieldValue);
}
