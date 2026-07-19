import { compare } from "./condition.util.js";

interface ResolvedLeaf {
  fieldId: string;
  inputType: string;
  operator: string;
  targetValue: unknown;
}

// A group node, as produced by treeBuilder.util.ts's buildRuleGroupTree: carries
// logicalOperator + a conditions[] array mixing leaf conditions and nested subgroups.
const isGroupNode = (node: unknown): boolean =>
  typeof node === "object" && node !== null && "logicalOperator" in node && Array.isArray((node as { conditions?: unknown }).conditions);

// Recursively evaluates a rule-group tree's AND/OR (ALL/ANY) structure against a
// resolved set of field answers, calling compare() per leaf condition. A benefit
// or dynamic field is always attached to exactly one main group — never directly
// to a bare condition — so `mainGroups` must hold exactly one root.
export const matchRuleGroupTree = (
  mainGroups: any[],
  answers: Record<string, unknown>,
  resolveLeaf: (leaf: any, group: any) => ResolvedLeaf,
): boolean => {
  if (mainGroups.length !== 1) {
    throw new Error("EXPECTED_EXACTLY_ONE_MAIN_RULE_GROUP");
  }

  const evaluateGroup = (group: any): boolean => {
    const results = group.conditions.map((item: unknown) => {
      if (isGroupNode(item)) return evaluateGroup(item);

      const { fieldId, inputType, operator, targetValue } = resolveLeaf(item, group);
      const actualValue = answers[fieldId];

      // No answer at all (field never shown — e.g. a follow-up gated on another field's
      // value — or simply left blank on an optional field) means this condition just isn't
      // satisfied. That's not a data error, so it's handled here rather than inside compare(),
      // which still throws on a present-but-wrong-shaped value (a genuine bug worth surfacing).
      if (actualValue === undefined || actualValue === null) return false;

      return compare({ inputType, operator, targetValue, actualValue });
    });

    return group.logicalOperator === "ALL" ? results.every(Boolean) : results.some(Boolean);
  };

  return evaluateGroup(mainGroups[0]);
};
