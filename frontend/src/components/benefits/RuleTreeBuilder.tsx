import { Plus, Trash2, FolderPlus } from "lucide-react";
import { getConditionOperators } from "@/mock/fields.mock";
import type { DimField, RuleTreeNode, RuleTreeRoot } from "@/types/domain";
import { ConditionValueInput } from "@/components/fields/ConditionValueInput";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface RuleTreeBuilderProps {
  fields: DimField[];
  tree: RuleTreeRoot;
  onChange: (tree: RuleTreeRoot) => void;
}

const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`);

function emptyCondition(fields: DimField[]): RuleTreeNode {
  const field = fields[0];
  const operator = field ? getConditionOperators(field.fieldInputTypeId)[0] : undefined;
  return { kind: "condition", id: newId(), fieldId: field?.id ?? "", fieldConditionOperatorId: operator?.id ?? "", conditionFieldValue: null };
}

function emptyGroup(): RuleTreeNode {
  return { kind: "group", id: newId(), logicalOperator: "ALL", children: [] };
}

// Recursive AND/OR eligibility condition tree editor — the composite payload this
// produces is the same RuleTreeRoot shape the mock eligibility matcher consumes
// (src/lib/eligibility.ts) and mirrors the real backend's dynamic-rule-tree shape.
export function RuleTreeBuilder({ fields, tree, onChange }: RuleTreeBuilderProps) {
  return <GroupEditor fields={fields} node={tree} onChange={(n) => onChange(n as RuleTreeRoot)} depth={0} />;
}

function GroupEditor({
  fields,
  node,
  onChange,
  depth,
}: {
  fields: DimField[];
  node: Extract<RuleTreeNode, { kind: "group" }>;
  onChange: (node: RuleTreeNode) => void;
  depth: number;
}) {
  const updateChild = (index: number, child: RuleTreeNode) => {
    const children = [...node.children];
    children[index] = child;
    onChange({ ...node, children });
  };

  const removeChild = (index: number) => {
    onChange({ ...node, children: node.children.filter((_, i) => i !== index) });
  };

  return (
    <div className={depth > 0 ? "rounded-lg border border-border bg-muted/20 p-3" : ""}>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Match</span>
        <Select value={node.logicalOperator} onValueChange={(v) => onChange({ ...node, logicalOperator: v as "ALL" | "ANY" })}>
          <SelectTrigger size="sm" className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ALL of</SelectItem>
            <SelectItem value="ANY">ANY of</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">the following conditions:</span>
      </div>

      <div className="flex flex-col gap-2">
        {node.children.length === 0 && <p className="text-xs text-muted-foreground">No conditions yet — add one below.</p>}

        {node.children.map((child, index) =>
          child.kind === "group" ? (
            <div key={child.id} className="flex items-start gap-2">
              <div className="flex-1">
                <GroupEditor fields={fields} node={child} onChange={(c) => updateChild(index, c)} depth={depth + 1} />
              </div>
              <Button type="button" size="icon" variant="ghost" className="mt-1 size-7 text-muted-foreground hover:text-destructive" onClick={() => removeChild(index)}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          ) : (
            <ConditionLeafEditor
              key={child.id}
              fields={fields}
              node={child}
              onChange={(c) => updateChild(index, c)}
              onRemove={() => removeChild(index)}
            />
          ),
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...node, children: [...node.children, emptyCondition(fields)] })}>
          <Plus /> Add Condition
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...node, children: [...node.children, emptyGroup()] })}>
          <FolderPlus /> Add Group
        </Button>
      </div>
    </div>
  );
}

function ConditionLeafEditor({
  fields,
  node,
  onChange,
  onRemove,
}: {
  fields: DimField[];
  node: Extract<RuleTreeNode, { kind: "condition" }>;
  onChange: (node: RuleTreeNode) => void;
  onRemove: () => void;
}) {
  const field = fields.find((f) => f.id === node.fieldId);
  const operators = field ? getConditionOperators(field.fieldInputTypeId) : [];
  const operator = operators.find((o) => o.id === node.fieldConditionOperatorId);

  const handleFieldChange = (fieldId: string) => {
    const nextField = fields.find((f) => f.id === fieldId);
    const nextOperator = nextField ? getConditionOperators(nextField.fieldInputTypeId)[0] : undefined;
    onChange({ ...node, fieldId, fieldConditionOperatorId: nextOperator?.id ?? "", conditionFieldValue: null });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
      <Select value={node.fieldId} onValueChange={handleFieldChange}>
        <SelectTrigger size="sm" className="w-48">
          <SelectValue placeholder="Select field" />
        </SelectTrigger>
        <SelectContent>
          {fields.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.englishName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {field && (
        <Select value={node.fieldConditionOperatorId} onValueChange={(v) => onChange({ ...node, fieldConditionOperatorId: v, conditionFieldValue: null })}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Operator" />
          </SelectTrigger>
          <SelectContent>
            {operators.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.englishName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field && operator && (
        <ConditionValueInput field={field} operator={operator} value={node.conditionFieldValue} onChange={(v) => onChange({ ...node, conditionFieldValue: v })} />
      )}

      {field?.default && (
        <Badge variant="secondary" className="text-[10px]">
          eGovPH field
        </Badge>
      )}

      <Button type="button" size="icon" variant="ghost" className="ml-auto size-7 text-muted-foreground hover:text-destructive" onClick={onRemove}>
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
