// Simplified, mock-only eligibility matcher for the frontend demo. This is explicitly NOT
// a reimplementation of the real backend's compare()/matchRuleGroupTree engine (see
// backend/src/utils/condition.util.ts + docs/condition-value-shapes.md) — that stays
// server-side. Just enough operator coverage for this mockup's sample benefits.
import { conditionOperators } from "@/mock/fields.mock";
import type { RuleTreeNode, RuleTreeRoot } from "@/types/domain";

export type MatchStatus = "MATCHED" | "PENDING" | "NOT_ELIGIBLE";

function operatorValue(fieldConditionOperatorId: string): string {
  return conditionOperators.find((o) => o.id === fieldConditionOperatorId)?.value ?? "";
}

function ageInYears(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function evaluateLeaf(operator: string, target: unknown, actual: unknown): boolean {
  switch (operator) {
    case "EQUALS":
      return actual === target;
    case "NOT_EQUALS":
      return actual !== target;
    case "GREATER_THAN":
      return typeof actual === "number" && typeof target === "number" && actual > target;
    case "LESS_THAN":
      return typeof actual === "number" && typeof target === "number" && actual < target;
    case "GREATER_THAN_EQUAL":
      return typeof actual === "number" && typeof target === "number" && actual >= target;
    case "LESS_THAN_EQUAL":
      return typeof actual === "number" && typeof target === "number" && actual <= target;
    case "BETWEEN": {
      const range = target as { min: number; max: number };
      return typeof actual === "number" && actual >= range.min && actual <= range.max;
    }
    case "IN":
      return Array.isArray(target) && Array.isArray(actual) && actual.some((v) => target.includes(v));
    case "NOT_IN":
      return Array.isArray(target) && Array.isArray(actual) && !actual.some((v) => target.includes(v));
    case "BELONGS_TO":
      return typeof actual === "string" && typeof target === "string" && actual === target;
    case "AGE_GREATER_THAN_EQUAL": {
      const t = target as { value: number };
      return typeof actual === "string" && ageInYears(actual) >= t.value;
    }
    case "AGE_LESS_THAN_EQUAL": {
      const t = target as { value: number };
      return typeof actual === "string" && ageInYears(actual) <= t.value;
    }
    case "AGE_BETWEEN": {
      const t = target as { min: number; max: number };
      const age = typeof actual === "string" ? ageInYears(actual) : null;
      return age !== null && age >= t.min && age <= t.max;
    }
    default:
      return false;
  }
}

function evaluateDuration(operator: string, target: { value: number; unit: string }, actual: { value: number; unit: string } | null): boolean {
  if (!actual || actual.unit !== target.unit) return false;
  switch (operator) {
    case "GREATER_THAN":
      return actual.value > target.value;
    case "LESS_THAN":
      return actual.value < target.value;
    case "GREATER_THAN_EQUAL":
      return actual.value >= target.value;
    case "LESS_THAN_EQUAL":
      return actual.value <= target.value;
    default:
      return false;
  }
}

function evaluateNode(node: RuleTreeNode, answers: Record<string, unknown>): MatchStatus {
  if (node.kind === "group") {
    const results = node.children.map((child) => evaluateNode(child, answers));

    if (node.logicalOperator === "ALL") {
      if (results.includes("NOT_ELIGIBLE")) return "NOT_ELIGIBLE";
      if (results.includes("PENDING")) return "PENDING";
      return "MATCHED";
    }

    // ANY
    if (results.includes("MATCHED")) return "MATCHED";
    if (results.includes("PENDING")) return "PENDING";
    return "NOT_ELIGIBLE";
  }

  const actual = answers[node.fieldId];
  if (actual === undefined || actual === null || actual === "") return "PENDING";

  const operator = operatorValue(node.fieldConditionOperatorId);

  const isDuration =
    typeof node.conditionFieldValue === "object" &&
    node.conditionFieldValue !== null &&
    "unit" in (node.conditionFieldValue as object) &&
    !("min" in (node.conditionFieldValue as object));

  const matched = isDuration
    ? evaluateDuration(operator, node.conditionFieldValue as { value: number; unit: string }, actual as { value: number; unit: string })
    : evaluateLeaf(operator, node.conditionFieldValue, actual);

  return matched ? "MATCHED" : "NOT_ELIGIBLE";
}

export function evaluateEligibility(tree: RuleTreeRoot, answers: Record<string, unknown>): MatchStatus {
  return evaluateNode(tree, answers);
}

// Field ids referenced by the tree that the given answers map doesn't have a value for
// yet — what Answer More needs to prompt for next.
export function getUnansweredFieldIds(node: RuleTreeNode, answers: Record<string, unknown>): string[] {
  if (node.kind === "group") {
    return node.children.flatMap((child) => getUnansweredFieldIds(child, answers));
  }
  const actual = answers[node.fieldId];
  return actual === undefined || actual === null || actual === "" ? [node.fieldId] : [];
}
