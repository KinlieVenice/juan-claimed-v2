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
  /** "PH_LOCATION" (and similar well-known system hierarchies) swaps in a purpose-built
   * field component instead of the generic static-node one — see FieldInput.tsx. Null for
   * every regular admin-authored hierarchy. */
  key: string | null;
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
  englishDescription: string;
  tagalogDescription: string;
  classification: FieldClassification;
  /** Non-comparator display field (name, address) vs. a field used in eligibility conditions. */
  isProfileField?: boolean;
  /** A system-shipped starter field, whether or not it's actually eGovPH-sourced (see eGovField). */
  default: boolean;
  /** True = value is genuinely eGovPH-sourced — pre-filled/view-only everywhere. Distinct from `default`. */
  eGovField: boolean;
  required: boolean;
  sortOrder: number;
  fieldInputTypeId: string;
  fieldInputType: DimFieldInputType;
  parentFieldId: string | null;
  fieldHierarchyId: string | null;
  configJson: Record<string, unknown> | null;
  /** This field's own show/hide condition ("Parent Dependents") — null means always visible. */
  dynamicCondition: FieldRuleTreeRoot | null;
  /** Renders this field pinned immediately under anchorFieldId instead of at its own flat
   * sortOrder — must be one of the fields referenced in this field's own dynamicCondition. */
  anchorFieldId: string | null;
}

// --- A field's own dynamic show/hide condition (mirrors FctDynamicRuleGroup +
// FctDynamicFieldCondition). Distinct from RuleTreeNode below (benefit eligibility) — a
// leaf here can reference a DIFFERENT field's answer via conditionFieldId (null = this
// field's own answer, matching the backend's self-referential default). A leaf also
// carries operatorValue/conditionFieldInputType — already resolved server-side from the FK
// ids (see fieldRuleGroup.service.ts's normalizeRuleTree) specifically so a frontend
// evaluator (lib/field-visibility.ts) can call its compare() equivalent directly against
// this tree, no separate operators/fields lookup needed.
export type FieldRuleTreeNode =
  | { kind: "group"; id: string; logicalOperator: RuleLogicalOperator; children: FieldRuleTreeNode[] }
  | {
      kind: "condition";
      id: string;
      fieldConditionOperatorId: string;
      operatorValue: string;
      conditionFieldValue: unknown;
      conditionFieldId: string | null;
      conditionFieldInputType: string;
    };

export type FieldRuleTreeRoot = Extract<FieldRuleTreeNode, { kind: "group" }>;

// --- Benefit eligibility rule tree. Backing tables (FctBenefitRuleGroup +
// DimBenefitFieldCondition) have a messier indirection — a leaf's fieldId actually lives on
// a throwaway FctDynamicRuleGroup wrapped by a FctDynamicFieldCondition — but
// benefitRuleGroup.service.ts resolves that server-side into this flat shape (a leaf
// carries its own fieldId directly), matching what this app's condition builders
// (RuleTreeBuilder.tsx etc.) already expect.
export type RuleLogicalOperator = "ALL" | "ANY";

export type RuleTreeNode =
  | { kind: "group"; id: string; logicalOperator: RuleLogicalOperator; children: RuleTreeNode[] }
  | { kind: "condition"; id: string; fieldId: string; fieldConditionOperatorId: string; conditionFieldValue: unknown };

export type RuleTreeRoot = Extract<RuleTreeNode, { kind: "group" }>;

// FctAttachment — polymorphic (entityType/entityId), hangs off a requirement/utilization/
// how-to-apply row, never the benefit directly. fileSize comes back as a STRING (BigInt
// column, JSON.stringify can't serialize BigInt — see backend/routes.md's attachments
// section). Real file bytes live in Vercel Blob; filePath is that blob's URL.
export interface FctAttachment {
  id: string;
  entityId: string;
  entityType: string;
  fileLabel: string;
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: string;
  metaData: Record<string, unknown>;
}

export interface FctBenefitRequirement {
  id: string;
  benefitId: string;
  englishName: string;
  tagalogName: string;
  englishDescription: string;
  tagalogDescription: string;
  attachments: FctAttachment[];
}

export interface FctBenefitUtilization {
  id: string;
  benefitId: string;
  englishName: string;
  tagalogName: string;
  englishDescription: string;
  tagalogDescription: string;
  attachments: FctAttachment[];
}

export interface FctBenefitHowToApply {
  id: string;
  benefitId: string;
  englishName: string;
  tagalogName: string;
  englishDescription: string;
  tagalogDescription: string;
  attachments: FctAttachment[];
}

export interface DimBenefitPsgcCode {
  id: string;
  benefitId: string;
  psgcCode: string;
  scopeId: string;
  /** Resolved server-side via the live PSGC API — undefined only if that lookup failed. */
  locationName?: string;
}

export interface DimBenefitGroup {
  id: string;
  benefitId: string;
  groupId: string;
  creator: boolean;
  group: { id: string; englishName: string; tagalogName: string };
}

export interface FctBenefit {
  id: string;
  name: string;
  englishDescription: string;
  tagalogDescription: string;
  isNationwide: boolean;
  benefitPsgcCodes: DimBenefitPsgcCode[];
  benefitGroups: DimBenefitGroup[];
  benefitRequirements: FctBenefitRequirement[];
  benefitUtilizations: FctBenefitUtilization[];
  benefitHowToApplies: FctBenefitHowToApply[];
  /** Only populated by GET /api/benefits/:id — the list endpoint omits it (not needed for
   * the admin list's summary columns, and would mean an extra tree-fetch per row). */
  eligibilityTree: RuleTreeRoot | null;
}

export type UserRole = "SUPERADMIN" | "AGENT" | "USER";

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
