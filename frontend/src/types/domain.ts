// Mirrors the shapes the real backend already returns (see backend/docs/api-docs.md).
// Field names match the Prisma models 1:1 so wiring later is a drop-in swap.

export type FieldInputTypeValue =
  | "TEXT"
  | "NUMBER"
  | "MONEY"
  | "DATE"
  | "BOOLEAN"
  | "SINGLE_SELECT"
  | "MULTI_SELECT"
  | "HIERARCHY_SELECT"
  | "DURATION"
  | "REPEATER_GROUP";

export interface DimFieldInputType {
  id: string;
  englishName: string;
  tagalogName: string;
  value: FieldInputTypeValue;
}

export interface DimFieldConditionOperator {
  id: string;
  englishName: string;
  tagalogName: string;
  value: string;
  fieldInputTypeId: string;
}

export interface DimFieldOption {
  id: string;
  fieldId: string;
  englishName: string;
  tagalogName: string;
  value: string;
  englishDescription: string;
  tagalogDescription: string;
  sortOrder: number;
}

export interface DimFieldHierarchyNode {
  id: string;
  fieldHierarchyId: string;
  parentNodeId: string | null;
  englishName: string;
  tagalogName: string;
  value: string;
  sortOrder: number;
}

export interface DimFieldHierarchyLevel {
  id: string;
  fieldHierarchyId: string;
  level: number;
  englishName: string;
  tagalogName: string;
}

export interface DimFieldHierarchy {
  id: string;
  englishName: string;
  tagalogName: string;
  fieldHierarchyLevels: DimFieldHierarchyLevel[];
  fieldHierarchyNodes: DimFieldHierarchyNode[];
}

export type FieldClassification = "GLOBAL" | "FOLLOW_UP";

export interface DimField {
  id: string;
  key: string;
  englishName: string;
  tagalogName: string;
  description: string;
  classification: FieldClassification;
  /** Non-comparator display field (name, address) vs. a field used in eligibility conditions. */
  isProfileField?: boolean;
  /** eGovPH-sourced — pre-filled, view-only everywhere. */
  default: boolean;
  required: boolean;
  sortOrder: number;
  fieldInputTypeId: string;
  fieldInputType: DimFieldInputType;
  parentFieldId: string | null;
  fieldHierarchyId: string | null;
}

// --- Benefit eligibility rule tree (mirrors FctBenefitRuleGroup + DimBenefitFieldCondition,
// flattened for the mock/UI layer — a leaf carries its own fieldId directly instead of the
// real backend's DimBenefitFieldCondition-wraps-FctDynamicFieldCondition indirection).
export type RuleLogicalOperator = "ALL" | "ANY";

export type RuleTreeNode =
  | { kind: "group"; id: string; logicalOperator: RuleLogicalOperator; children: RuleTreeNode[] }
  | { kind: "condition"; id: string; fieldId: string; fieldConditionOperatorId: string; conditionFieldValue: unknown };

export type RuleTreeRoot = Extract<RuleTreeNode, { kind: "group" }>;

export interface FctBenefitRequirement {
  id: string;
  benefitId: string;
  englishName: string;
  tagalogName: string;
  englishDescription: string;
  tagalogDescription: string;
  documents: string[];
}

export interface FctBenefitUtilization {
  id: string;
  benefitId: string;
  englishName: string;
  tagalogName: string;
  englishDescription: string;
  tagalogDescription: string;
}

export interface FctBenefit {
  id: string;
  name: string;
  englishDescription: string;
  tagalogDescription: string;
  isNationwide: boolean;
  scopeName: string;
  benefitRequirements: FctBenefitRequirement[];
  benefitUtilizations: FctBenefitUtilization[];
  eligibilityTree: RuleTreeRoot;
}

export type UserRole = "SUPERADMIN" | "AGENT" | "USER";

export interface DimGroup {
  id: string;
  name: string;
  description: string;
}

export interface DimUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  groupId: string | null;
  active: boolean;
}

// --- Answers (mirrors FctUserFieldAnswer / FctUserFieldAnswerGroup)
export interface UserFieldAnswer {
  id: string;
  fieldId: string;
  repeaterGroupId: string | null;
  value: unknown;
}

export interface UserFieldAnswerGroup {
  id: string;
  fieldId: string;
  sortOrder: number;
}
