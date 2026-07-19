// Pure input-type/operator evaluator. No DB access here on purpose —
// callers resolve the DimFieldInputType/DimFieldConditionOperator `.value`
// strings first (see services/operator.service.ts) and pass them in.

import dayjs from "./dayjs.util.js";

export interface CompareInput {
  inputType: string;
  operator: string;
  targetValue: unknown;
  actualValue: unknown;
}

type ValueLabel = "TARGET" | "ACTUAL";

const toText = (value: unknown, label: ValueLabel): string => {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") throw new Error(`INVALID_${label}_VALUE`);
  return value;
};

const isBlank = (value: string): boolean => value.trim().length === 0;

const toNumber = (value: unknown, label: ValueLabel): number => {
  if (typeof value !== "number" || Number.isNaN(value)) throw new Error(`INVALID_${label}_VALUE`);
  return value;
};

const toNumberArray = (value: unknown, label: ValueLabel): number[] => {
  if (!Array.isArray(value)) throw new Error(`INVALID_${label}_VALUE`);
  return value.map((item) => toNumber(item, label));
};

const toStringArray = (value: unknown, label: ValueLabel): string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`INVALID_${label}_VALUE`);
  }
  return value;
};

const toBoolean = (value: unknown, label: ValueLabel): boolean => {
  if (typeof value !== "boolean") throw new Error(`INVALID_${label}_VALUE`);
  return value;
};

const toDate = (value: unknown, label: ValueLabel): Date => {
  const date = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(date.getTime())) throw new Error(`INVALID_${label}_VALUE`);
  return date;
};

const sameMembers = (a: string[], b: string[]): boolean =>
  JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());

type AgeUnit = "days" | "months" | "years";

const isAgeUnit = (value: unknown): value is AgeUnit =>
  value === "days" || value === "months" || value === "years";

const toAgeTarget = (value: unknown, label: ValueLabel): { value: number; unit: AgeUnit } => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("value" in value) ||
    !("unit" in value) ||
    !isAgeUnit((value as { unit: unknown }).unit)
  ) {
    throw new Error(`INVALID_${label}_VALUE`);
  }
  return { value: toNumber((value as { value: unknown }).value, label), unit: (value as { unit: AgeUnit }).unit };
};

const toAgeRangeTarget = (value: unknown, label: ValueLabel): { min: number; max: number; unit: AgeUnit } => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("min" in value) ||
    !("max" in value) ||
    !("unit" in value) ||
    !isAgeUnit((value as { unit: unknown }).unit)
  ) {
    throw new Error(`INVALID_${label}_VALUE`);
  }
  return {
    min: toNumber((value as { min: unknown }).min, label),
    max: toNumber((value as { max: unknown }).max, label),
    unit: (value as { unit: AgeUnit }).unit,
  };
};

const hasExplicitTime = (value: unknown): boolean => typeof value === "string" && /T\d{2}:\d{2}/.test(value);

const AGE_OPERATORS = new Set([
  "AGE_GREATER_THAN",
  "AGE_LESS_THAN",
  "AGE_GREATER_THAN_EQUAL",
  "AGE_LESS_THAN_EQUAL",
  "AGE_EQUALS",
  "AGE_NOT_EQUALS",
  "AGE_BETWEEN",
]);

// actualValue is treated as a birth date for age checks (e.g. senior citizen benefits).
const evaluateAge = (operator: string, targetValue: unknown, actualValue: unknown): boolean => {
  const birthDate = toDate(actualValue, "ACTUAL");

  if (operator === "AGE_BETWEEN") {
    const { min, max, unit } = toAgeRangeTarget(targetValue, "TARGET");
    const diff = dayjs().diff(dayjs(birthDate), unit);
    return diff >= min && diff <= max;
  }

  const { value: threshold, unit } = toAgeTarget(targetValue, "TARGET");
  const diff = dayjs().diff(dayjs(birthDate), unit);
  switch (operator) {
    case "AGE_GREATER_THAN":
      return diff > threshold;
    case "AGE_LESS_THAN":
      return diff < threshold;
    case "AGE_GREATER_THAN_EQUAL":
      return diff >= threshold;
    case "AGE_LESS_THAN_EQUAL":
      return diff <= threshold;
    case "AGE_EQUALS":
      return diff === threshold;
    case "AGE_NOT_EQUALS":
      return diff !== threshold;
    default:
      throw new Error("UNSUPPORTED_OPERATOR_FOR_INPUT_TYPE");
  }
};

const evaluateText = (operator: string, targetValue: unknown, actualValue: unknown): boolean => {
  const actual = toText(actualValue, "ACTUAL").toLowerCase().trim();

  if (operator === "IS_EMPTY") return isBlank(actual);
  if (operator === "IS_NOT_EMPTY") return !isBlank(actual);

  const target = toText(targetValue, "TARGET").toLowerCase().trim();
  switch (operator) {
    case "EQUALS":
      return actual === target;
    case "NOT_EQUALS":
      return actual !== target;
    case "STARTS_WITH":
      return actual.startsWith(target);
    case "ENDS_WITH":
      return actual.endsWith(target);
    case "CONTAINS_SUBSTRING":
      return actual.includes(target);
    case "NOT_CONTAINS_SUBSTRING":
      return !actual.includes(target);
    default:
      throw new Error("UNSUPPORTED_OPERATOR_FOR_INPUT_TYPE");
  }
};

// Shared by NUMBER and MONEY — plain unitless magnitude comparisons.
const evaluateNumeric = (operator: string, targetValue: unknown, actualValue: unknown): boolean => {
  const actual = toNumber(actualValue, "ACTUAL");

  if (operator === "BETWEEN") {
    if (typeof targetValue !== "object" || targetValue === null || !("min" in targetValue) || !("max" in targetValue)) {
      throw new Error("INVALID_TARGET_VALUE");
    }
    const min = toNumber((targetValue as { min: unknown }).min, "TARGET");
    const max = toNumber((targetValue as { max: unknown }).max, "TARGET");
    return actual >= min && actual <= max;
  }

  const target = toNumber(targetValue, "TARGET");
  switch (operator) {
    case "EQUALS":
      return actual === target;
    case "NOT_EQUALS":
      return actual !== target;
    case "GREATER_THAN":
      return actual > target;
    case "LESS_THAN":
      return actual < target;
    case "GREATER_THAN_EQUAL":
      return actual >= target;
    case "LESS_THAN_EQUAL":
      return actual <= target;
    default:
      throw new Error("UNSUPPORTED_OPERATOR_FOR_INPUT_TYPE");
  }
};

type DurationUnit = "days" | "weeks" | "months" | "years";

const DURATION_DAYS_PER_UNIT: Record<DurationUnit, number> = {
  days: 1,
  weeks: 7,
  months: 30,
  years: 365,
};

const isDurationUnit = (value: unknown): value is DurationUnit =>
  value === "days" || value === "weeks" || value === "months" || value === "years";

// Both sides are raw { value, unit } magnitudes (no anchor date to diff against,
// unlike AGE), so cross-unit comparison requires converting to a common base unit.
// week/month/year are fixed day-count approximations, not exact calendar math.
const toDurationDays = (value: unknown, label: ValueLabel): number => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("value" in value) ||
    !("unit" in value) ||
    !isDurationUnit((value as { unit: unknown }).unit)
  ) {
    throw new Error(`INVALID_${label}_VALUE`);
  }
  const amount = toNumber((value as { value: unknown }).value, label);
  const unit = (value as { unit: DurationUnit }).unit;
  return amount * DURATION_DAYS_PER_UNIT[unit];
};

const toDurationRangeDays = (value: unknown, label: ValueLabel): { min: number; max: number } => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("min" in value) ||
    !("max" in value) ||
    !("unit" in value) ||
    !isDurationUnit((value as { unit: unknown }).unit)
  ) {
    throw new Error(`INVALID_${label}_VALUE`);
  }
  const unit = (value as { unit: DurationUnit }).unit;
  const daysPerUnit = DURATION_DAYS_PER_UNIT[unit];
  return {
    min: toNumber((value as { min: unknown }).min, label) * daysPerUnit,
    max: toNumber((value as { max: unknown }).max, label) * daysPerUnit,
  };
};

const evaluateDuration = (operator: string, targetValue: unknown, actualValue: unknown): boolean => {
  const actual = toDurationDays(actualValue, "ACTUAL");

  if (operator === "BETWEEN") {
    const { min, max } = toDurationRangeDays(targetValue, "TARGET");
    return actual >= min && actual <= max;
  }

  const target = toDurationDays(targetValue, "TARGET");
  switch (operator) {
    case "EQUALS":
      return actual === target;
    case "NOT_EQUALS":
      return actual !== target;
    case "GREATER_THAN":
      return actual > target;
    case "LESS_THAN":
      return actual < target;
    case "GREATER_THAN_EQUAL":
      return actual >= target;
    case "LESS_THAN_EQUAL":
      return actual <= target;
    default:
      throw new Error("UNSUPPORTED_OPERATOR_FOR_INPUT_TYPE");
  }
};

type CurrentPeriodOperator = "IS_CURRENT_DAY" | "IS_CURRENT_WEEK" | "IS_CURRENT_MONTH" | "IS_CURRENT_YEAR";

const CURRENT_PERIOD_UNIT: Record<CurrentPeriodOperator, "day" | "week" | "month" | "year"> = {
  IS_CURRENT_DAY: "day",
  IS_CURRENT_WEEK: "week",
  IS_CURRENT_MONTH: "month",
  IS_CURRENT_YEAR: "year",
};

const isCurrentPeriodOperator = (operator: string): operator is CurrentPeriodOperator => operator in CURRENT_PERIOD_UNIT;

const evaluateDate = (operator: string, targetValue: unknown, actualValue: unknown): boolean => {
  if (operator === "IN_THE_PAST" || operator === "IN_THE_FUTURE") {
    const actual = toDate(actualValue, "ACTUAL");
    return operator === "IN_THE_PAST" ? actual.getTime() < Date.now() : actual.getTime() > Date.now();
  }

  if (isCurrentPeriodOperator(operator)) {
    const actual = toDate(actualValue, "ACTUAL");
    return dayjs(actual).isSame(dayjs(), CURRENT_PERIOD_UNIT[operator]);
  }

  if (AGE_OPERATORS.has(operator)) {
    return evaluateAge(operator, targetValue, actualValue);
  }

  // targetValue: { from, to } ISO date/datetime strings — a range shape, not a single date, so it's handled
  // before the generic actual/target date parsing below (same reason AGE/AGE_BETWEEN are special-cased above).
  if (operator === "BETWEEN") {
    if (typeof targetValue !== "object" || targetValue === null || !("from" in targetValue) || !("to" in targetValue)) {
      throw new Error("INVALID_TARGET_VALUE");
    }
    const fromRaw = (targetValue as { from: unknown }).from;
    const toRaw = (targetValue as { to: unknown }).to;
    const actualHasTime = hasExplicitTime(actualValue);
    if (actualHasTime !== hasExplicitTime(fromRaw) || actualHasTime !== hasExplicitTime(toRaw)) {
      throw new Error("INVALID_TARGET_VALUE");
    }
    const granularity = actualHasTime ? "millisecond" : "day";
    const actual = dayjs(toDate(actualValue, "ACTUAL"));
    const from = dayjs(toDate(fromRaw, "TARGET"));
    const to = dayjs(toDate(toRaw, "TARGET"));
    return actual.isSameOrAfter(from, granularity) && actual.isSameOrBefore(to, granularity);
  }

  const actual = toDate(actualValue, "ACTUAL");
  const target = toDate(targetValue, "TARGET");

  switch (operator) {
    case "BEFORE":
      return actual.getTime() < target.getTime();
    case "AFTER":
      return actual.getTime() > target.getTime();
    case "EQUALS":
    case "ON_OR_BEFORE":
    case "ON_OR_AFTER": {
      const actualHasTime = hasExplicitTime(actualValue);
      const targetHasTime = hasExplicitTime(targetValue);
      // UI is expected to keep both sides the same shape (with/without a time picker);
      // a mismatch is a data bug, not something to guess at.
      if (actualHasTime !== targetHasTime) throw new Error("INVALID_TARGET_VALUE");
      const granularity = actualHasTime ? "millisecond" : "day";
      const a = dayjs(actual);
      const t = dayjs(target);
      if (operator === "EQUALS") return a.isSame(t, granularity);
      return operator === "ON_OR_BEFORE" ? a.isSameOrBefore(t, granularity) : a.isSameOrAfter(t, granularity);
    }
    default:
      throw new Error("UNSUPPORTED_OPERATOR_FOR_INPUT_TYPE");
  }
};

const evaluateBoolean = (operator: string, targetValue: unknown, actualValue: unknown): boolean => {
  if (operator !== "EQUALS") throw new Error("UNSUPPORTED_OPERATOR_FOR_INPUT_TYPE");
  return toBoolean(actualValue, "ACTUAL") === toBoolean(targetValue, "TARGET");
};

const evaluateSingleSelect = (operator: string, targetValue: unknown, actualValue: unknown): boolean => {
  const actual = toText(actualValue, "ACTUAL");
  const target = toText(targetValue, "TARGET");
  switch (operator) {
    case "EQUALS":
      return actual === target;
    case "NOT_EQUALS":
      return actual !== target;
    default:
      throw new Error("UNSUPPORTED_OPERATOR_FOR_INPUT_TYPE");
  }
};

// actualValue: the option values the user selected, e.g. ["PWD", "SENIOR"]
const evaluateMultiSelect = (operator: string, targetValue: unknown, actualValue: unknown): boolean => {
  const actual = toStringArray(actualValue, "ACTUAL");
  const target = toStringArray(targetValue, "TARGET");
  switch (operator) {
    case "EQUALS":
      return sameMembers(actual, target);
    case "NOT_EQUALS":
      return !sameMembers(actual, target);
    case "IN":
      return actual.some((value) => target.includes(value));
    case "NOT_IN":
      return actual.every((value) => !target.includes(value));
    default:
      throw new Error("UNSUPPORTED_OPERATOR_FOR_INPUT_TYPE");
  }
};

const evaluateHierarchySelect = (operator: string, targetValue: unknown, actualValue: unknown): boolean => {
  if (operator === "IS_EMPTY" || operator === "IS_NOT_EMPTY") {
    const isEmpty = actualValue === null || actualValue === undefined || actualValue === "";
    return operator === "IS_EMPTY" ? isEmpty : !isEmpty;
  }

  // BELONGS_TO checks the selected node's ancestor chain, root-first,
  // e.g. actualValue: ["NCR", "Manila", "Ermita"], targetValue: "Manila"
  if (operator === "BELONGS_TO") {
    const ancestorPath = toStringArray(actualValue, "ACTUAL");
    return ancestorPath.includes(toText(targetValue, "TARGET"));
  }

  const actual = toText(actualValue, "ACTUAL");
  switch (operator) {
    case "EQUALS":
      return actual === toText(targetValue, "TARGET");
    case "NOT_EQUALS":
      return actual !== toText(targetValue, "TARGET");
    case "IN":
      return toStringArray(targetValue, "TARGET").includes(actual);
    default:
      throw new Error("UNSUPPORTED_OPERATOR_FOR_INPUT_TYPE");
  }
};

interface RepeaterConditionLeaf {
  fieldId: string;
  inputType: string;
  operator: string;
  conditionFieldValue: unknown;
}

type RepeaterGroupNode = { logicalOperator: "ALL" | "ANY"; conditions: unknown[] };

const isRepeaterGroupNode = (node: unknown): node is RepeaterGroupNode =>
  typeof node === "object" &&
  node !== null &&
  ((node as { logicalOperator?: unknown }).logicalOperator === "ALL" || (node as { logicalOperator?: unknown }).logicalOperator === "ANY") &&
  Array.isArray((node as { conditions?: unknown }).conditions);

const isRepeaterConditionLeaf = (node: unknown): node is RepeaterConditionLeaf =>
  typeof node === "object" &&
  node !== null &&
  typeof (node as { fieldId?: unknown }).fieldId === "string" &&
  typeof (node as { inputType?: unknown }).inputType === "string" &&
  typeof (node as { operator?: unknown }).operator === "string" &&
  "conditionFieldValue" in node;

// Recursively matches one repeater row against a mini AND/OR condition tree.
// fieldId is a lookup key into the row (the child field this leaf checks), not a DB
// foreign key — condition.util.ts stays DB-free, the tree carries everything it needs.
const matchRepeaterRow = (node: unknown, row: Record<string, unknown>): boolean => {
  if (isRepeaterGroupNode(node)) {
    const results = node.conditions.map((child) => matchRepeaterRow(child, row));
    return node.logicalOperator === "ALL" ? results.every(Boolean) : results.some(Boolean);
  }
  if (isRepeaterConditionLeaf(node)) {
    const actualValue = row[node.fieldId];
    // A row with no value at all for this field (left blank on an optional child field)
    // just doesn't satisfy the condition — not a data error. See matchRuleGroupTree's
    // identical guard in ruleGroupMatcher.util.ts for the full reasoning.
    if (actualValue === undefined || actualValue === null) return false;

    return compare({
      inputType: node.inputType,
      operator: node.operator,
      targetValue: node.conditionFieldValue,
      actualValue,
    });
  }
  throw new Error("INVALID_TARGET_VALUE");
};

// actualValue: one entry per repeater row.
// - aggregate operators expect actualValue: number[] (the row values already picked out by the caller)
// - ANY_MATCH / ALL_MATCH expect actualValue: Array<Record<fieldId, value>> (each row's child-field
//   answers) and targetValue: [{ logicalOperator, conditions: [...] }] — a single-root mini rule-group
//   tree, same shape as services/ruleGroup.service.ts's benefit/dynamic trees, evaluated per row.
//   ANY_MATCH: at least one row matches the tree. ALL_MATCH: every row matches the tree.
const evaluateRepeaterGroup = (operator: string, targetValue: unknown, actualValue: unknown): boolean => {
  if (operator === "ANY_MATCH" || operator === "ALL_MATCH") {
    if (!Array.isArray(actualValue)) throw new Error("INVALID_ACTUAL_VALUE");
    if (!Array.isArray(targetValue) || targetValue.length !== 1 || !isRepeaterGroupNode(targetValue[0])) {
      throw new Error("INVALID_TARGET_VALUE");
    }
    const rootNode = targetValue[0];

    const matchesRow = (row: unknown): boolean => {
      if (typeof row !== "object" || row === null) throw new Error("INVALID_ACTUAL_VALUE");
      return matchRepeaterRow(rootNode, row as Record<string, unknown>);
    };

    return operator === "ANY_MATCH" ? actualValue.some(matchesRow) : actualValue.every(matchesRow);
  }

  const actual = toNumberArray(actualValue, "ACTUAL");
  const target = toNumber(targetValue, "TARGET");
  switch (operator) {
    case "COUNT_EQUALS":
      return actual.length === target;
    case "SUM_GREATER_THAN":
      return actual.reduce((sum, n) => sum + n, 0) > target;
    case "MIN_LESS_THAN":
      return actual.length > 0 && Math.min(...actual) < target;
    case "MAX_GREATER_THAN":
      return actual.length > 0 && Math.max(...actual) > target;
    case "AVERAGE_GREATER_THAN":
      return actual.length > 0 && actual.reduce((sum, n) => sum + n, 0) / actual.length > target;
    default:
      throw new Error("UNSUPPORTED_OPERATOR_FOR_INPUT_TYPE");
  }
};

export const compare = ({ inputType, operator, targetValue, actualValue }: CompareInput): boolean => {
  switch (inputType) {
    case "TEXT":
      return evaluateText(operator, targetValue, actualValue);
    case "NUMBER":
    case "MONEY":
      return evaluateNumeric(operator, targetValue, actualValue);
    case "DURATION":
      return evaluateDuration(operator, targetValue, actualValue);
    case "DATE":
      return evaluateDate(operator, targetValue, actualValue);
    case "BOOLEAN":
      return evaluateBoolean(operator, targetValue, actualValue);
    case "SINGLE_SELECT":
      return evaluateSingleSelect(operator, targetValue, actualValue);
    case "MULTI_SELECT":
      return evaluateMultiSelect(operator, targetValue, actualValue);
    case "HIERARCHY_SELECT":
      return evaluateHierarchySelect(operator, targetValue, actualValue);
    case "REPEATER_GROUP":
      return evaluateRepeaterGroup(operator, targetValue, actualValue);
    default:
      throw new Error("UNSUPPORTED_INPUT_TYPE");
  }
};
