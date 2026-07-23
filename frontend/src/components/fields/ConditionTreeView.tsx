import * as React from "react";
import { Check, X, HelpCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getFieldOptions } from "@/services/fieldOptions.service";
import { formatConditionValue } from "@/lib/format-condition-value";
import type { DimField, DimFieldConditionOperator, DimFieldHierarchy, DimFieldOption, FieldRuleTreeNode, FieldRuleTreeRoot, RuleTreeNode, RuleTreeRoot } from "@/types/domain";

export type LeafEligibilityStatus = "MATCHED" | "NOT_ELIGIBLE" | "PENDING";

// Plain Tailwind colors, not the clay-* utilities — this component is shared with the
// admin-side field/benefit condition editors (FieldFormModal/BenefitFormModal), which
// never pass leafStatusByFieldId (no eligibility concept there) but shouldn't pull in the
// user-side-only clay design system just because this file also renders on BenefitDetailsPage.
const STATUS_ICON = { MATCHED: Check, NOT_ELIGIBLE: X, PENDING: HelpCircle } as const;
const STATUS_COLOR: Record<LeafEligibilityStatus, string> = {
  MATCHED: "bg-emerald-600 text-white",
  NOT_ELIGIBLE: "bg-red-600 text-white",
  PENDING: "bg-yellow-400 text-slate-900",
};

type AnyTreeNode = FieldRuleTreeNode | RuleTreeNode;
type AnyGroupNode = Extract<AnyTreeNode, { kind: "group" }>;
type AnyLeafNode = Extract<AnyTreeNode, { kind: "condition" }>;

interface ConditionTreeViewProps {
  tree: FieldRuleTreeRoot | RuleTreeRoot | null;
  /** "field" = a DimField's own dynamicCondition (leaf carries conditionFieldId, null means
   * "this field's own answer" — see selfField below). "benefit" = a benefit's eligibility
   * tree (leaf always carries a real fieldId, no self-reference concept). */
  treeKind: "field" | "benefit";
  fields: DimField[];
  operators: DimFieldConditionOperator[];
  hierarchies: DimFieldHierarchy[];
  /** Required for treeKind="field" whenever a leaf's conditionFieldId is null. */
  selfField?: DimField;
  emptyLabel?: string;
  /** fieldId -> this applicant's live verdict for that leaf (benefitEligibility.service.ts's
   * per-leaf breakdown) — when given, each leaf row gets a colored check/x/pending badge on
   * the right. Omit entirely for the admin condition editors (FieldFormModal/
   * BenefitFormModal), which have no applicant/eligibility concept to show. */
  leafStatusByFieldId?: Record<string, LeafEligibilityStatus>;
}

interface ResolvedLeaf {
  fieldId: string;
  fieldEn: string;
  fieldTl: string;
  operatorEn: string;
  operatorTl: string;
  valueEn: string;
  valueTl: string;
}

const resolveLeafField = (leaf: AnyLeafNode, treeKind: "field" | "benefit", fields: DimField[], selfField: DimField | undefined): DimField | undefined => {
  if (treeKind === "benefit") return fields.find((f) => f.id === (leaf as Extract<RuleTreeNode, { kind: "condition" }>).fieldId);
  const conditionFieldId = (leaf as Extract<FieldRuleTreeNode, { kind: "condition" }>).conditionFieldId;
  return conditionFieldId ? fields.find((f) => f.id === conditionFieldId) : selfField;
};

const resolveLeaf = (
  leaf: AnyLeafNode,
  treeKind: "field" | "benefit",
  fields: DimField[],
  operators: DimFieldConditionOperator[],
  hierarchies: DimFieldHierarchy[],
  selfField: DimField | undefined,
  optionsByFieldId: Record<string, DimFieldOption[]>,
): ResolvedLeaf | null => {
  const field = resolveLeafField(leaf, treeKind, fields, selfField);
  const operator = operators.find((o) => o.id === leaf.fieldConditionOperatorId);
  if (!field || !operator) return null;

  const value = formatConditionValue(field, operator, leaf.conditionFieldValue, optionsByFieldId[field.id] ?? [], hierarchies);
  return {
    fieldId: field.id,
    fieldEn: field.englishName,
    fieldTl: field.tagalogName,
    operatorEn: operator.englishName,
    operatorTl: operator.tagalogName,
    valueEn: value.en,
    valueTl: value.tl,
  };
};

// Every SINGLE_SELECT/MULTI_SELECT field referenced anywhere in the tree, walked once up
// front — same "fetch options per referenced field" need ConditionValueInput.tsx has, just
// collected for the whole tree at once instead of one field at a time per open leaf editor.
const collectSelectFieldIds = (node: AnyTreeNode, treeKind: "field" | "benefit", fields: DimField[], selfField: DimField | undefined, acc: Set<string>) => {
  if (node.kind === "group") {
    node.children.forEach((child) => collectSelectFieldIds(child as AnyTreeNode, treeKind, fields, selfField, acc));
    return;
  }
  const field = resolveLeafField(node, treeKind, fields, selfField);
  if (field && (field.fieldInputType.value === "SINGLE_SELECT" || field.fieldInputType.value === "MULTI_SELECT")) acc.add(field.id);
};

// Read-only, human-readable rendering of a FieldRuleTreeRoot/RuleTreeRoot — the "View mode"
// counterpart to FieldConditionTreeBuilder.tsx/RuleTreeBuilder.tsx (those stay
// edit-only; a locked/inert copy of a field/operator/value dropdown row still looks like a
// form, not a details view). Each leaf renders as "Field Operator Value" in English, with
// the Tagalog equivalent italicized in parens underneath; groups join their children with
// an OR (O) / AND (AT) connector and wrap in visible parentheses once nested.
export function ConditionTreeView({
  tree,
  treeKind,
  fields,
  operators,
  hierarchies,
  selfField,
  emptyLabel = "No conditions set.",
  leafStatusByFieldId,
}: ConditionTreeViewProps) {
  const { token } = useAuth();
  const [optionsByFieldId, setOptionsByFieldId] = React.useState<Record<string, DimFieldOption[]>>({});

  React.useEffect(() => {
    if (!tree) return;
    const ids = new Set<string>();
    collectSelectFieldIds(tree, treeKind, fields, selfField, ids);
    ids.forEach((id) => {
      getFieldOptions(id, token ?? undefined).then((opts) => setOptionsByFieldId((prev) => (id in prev ? prev : { ...prev, [id]: opts })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, treeKind]);

  if (!tree || tree.children.length === 0) {
    return <p className="text-xs text-muted-foreground italic">{emptyLabel}</p>;
  }

  return (
    <GroupView
      node={tree}
      depth={0}
      treeKind={treeKind}
      fields={fields}
      operators={operators}
      hierarchies={hierarchies}
      selfField={selfField}
      optionsByFieldId={optionsByFieldId}
      leafStatusByFieldId={leafStatusByFieldId}
    />
  );
}

function GroupView({
  node,
  depth,
  treeKind,
  fields,
  operators,
  hierarchies,
  selfField,
  optionsByFieldId,
  leafStatusByFieldId,
}: {
  node: AnyGroupNode;
  depth: number;
  treeKind: "field" | "benefit";
  fields: DimField[];
  operators: DimFieldConditionOperator[];
  hierarchies: DimFieldHierarchy[];
  selfField: DimField | undefined;
  optionsByFieldId: Record<string, DimFieldOption[]>;
  leafStatusByFieldId: Record<string, LeafEligibilityStatus> | undefined;
}) {
  const connectorLabel = node.logicalOperator === "ALL" ? "AND (AT)" : "OR (O)";

  return (
    <div className="flex items-stretch gap-1.5">
      {depth > 0 && <span className="text-sm font-bold text-muted-foreground">(</span>}
      <div className="flex flex-1 flex-col gap-2">
        {node.children.map((child, index) => (
          <React.Fragment key={child.id}>
            {index > 0 && <p className="text-[11px] font-bold tracking-wide text-muted-foreground">{connectorLabel}</p>}
            {child.kind === "group" ? (
              <GroupView
                node={child as AnyGroupNode}
                depth={depth + 1}
                treeKind={treeKind}
                fields={fields}
                operators={operators}
                hierarchies={hierarchies}
                selfField={selfField}
                optionsByFieldId={optionsByFieldId}
                leafStatusByFieldId={leafStatusByFieldId}
              />
            ) : (
              <LeafView
                leaf={child as AnyLeafNode}
                treeKind={treeKind}
                fields={fields}
                operators={operators}
                hierarchies={hierarchies}
                selfField={selfField}
                optionsByFieldId={optionsByFieldId}
                leafStatusByFieldId={leafStatusByFieldId}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      {depth > 0 && <span className="text-sm font-bold text-muted-foreground">)</span>}
    </div>
  );
}

function LeafView({
  leaf,
  treeKind,
  fields,
  operators,
  hierarchies,
  selfField,
  optionsByFieldId,
  leafStatusByFieldId,
}: {
  leaf: AnyLeafNode;
  treeKind: "field" | "benefit";
  fields: DimField[];
  operators: DimFieldConditionOperator[];
  hierarchies: DimFieldHierarchy[];
  selfField: DimField | undefined;
  optionsByFieldId: Record<string, DimFieldOption[]>;
  leafStatusByFieldId: Record<string, LeafEligibilityStatus> | undefined;
}) {
  const resolved = resolveLeaf(leaf, treeKind, fields, operators, hierarchies, selfField, optionsByFieldId);

  if (!resolved) {
    return <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground italic">Unresolved condition.</p>;
  }

  const status = leafStatusByFieldId?.[resolved.fieldId];
  const StatusIcon = status ? STATUS_ICON[status] : null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
      <div className="flex-1">
        <p className="text-sm text-foreground">
          {resolved.fieldEn} {resolved.operatorEn} {resolved.valueEn}
        </p>
        <p className="text-xs text-muted-foreground italic">
          ({resolved.fieldTl} {resolved.operatorTl} {resolved.valueTl})
        </p>
      </div>
      {StatusIcon && (
        <span className={`grid size-7 shrink-0 place-items-center rounded-full ${STATUS_COLOR[status!]}`}>
          <StatusIcon className="size-4" />
        </span>
      )}
    </div>
  );
}
