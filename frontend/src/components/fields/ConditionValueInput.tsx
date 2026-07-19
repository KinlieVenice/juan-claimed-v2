import { getFieldOptions, hierarchies } from "@/mock/fields.mock";
import type { DimField, DimFieldConditionOperator } from "@/types/domain";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface ConditionValueInputProps {
  field: DimField;
  operator: DimFieldConditionOperator;
  value: unknown;
  onChange: (value: unknown) => void;
}

const DURATION_UNITS = ["days", "weeks", "months", "years"];
const AGE_UNITS = ["days", "months", "years"];

// The threshold/target-value editor for one condition leaf in a benefit's eligibility
// tree — a sibling to FieldInput (which edits an applicant's *answer*), built against the
// same per-operator targetValue shapes documented in backend/docs/condition-value-shapes.md.
export function ConditionValueInput({ field, operator, value, onChange }: ConditionValueInputProps) {
  const inputType = field.fieldInputType.value;
  const op = operator.value;

  if (op === "BETWEEN") {
    const v = (value as { min?: number; max?: number }) ?? {};
    return (
      <div className="flex items-center gap-2">
        <Input type="number" placeholder="Min" value={v.min ?? ""} onChange={(e) => onChange({ ...v, min: Number(e.target.value) })} className="w-24" />
        <span className="text-xs text-muted-foreground">and</span>
        <Input type="number" placeholder="Max" value={v.max ?? ""} onChange={(e) => onChange({ ...v, max: Number(e.target.value) })} className="w-24" />
      </div>
    );
  }

  if (op === "AGE_GREATER_THAN_EQUAL" || op === "AGE_LESS_THAN_EQUAL") {
    const v = (value as { value?: number; unit?: string }) ?? {};
    return (
      <div className="flex items-center gap-2">
        <Input type="number" value={v.value ?? ""} onChange={(e) => onChange({ value: Number(e.target.value), unit: v.unit ?? "years" })} className="w-20" />
        <Select value={v.unit ?? "years"} onValueChange={(u) => onChange({ value: v.value ?? 0, unit: u })}>
          <SelectTrigger size="sm" className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {AGE_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (op === "AGE_BETWEEN") {
    const v = (value as { min?: number; max?: number; unit?: string }) ?? {};
    return (
      <div className="flex items-center gap-2">
        <Input type="number" placeholder="Min" value={v.min ?? ""} onChange={(e) => onChange({ ...v, min: Number(e.target.value), unit: v.unit ?? "years" })} className="w-20" />
        <span className="text-xs text-muted-foreground">to</span>
        <Input type="number" placeholder="Max" value={v.max ?? ""} onChange={(e) => onChange({ ...v, max: Number(e.target.value), unit: v.unit ?? "years" })} className="w-20" />
        <Select value={v.unit ?? "years"} onValueChange={(u) => onChange({ ...v, unit: u })}>
          <SelectTrigger size="sm" className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {AGE_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (inputType === "DURATION") {
    const v = (value as { value?: number; unit?: string }) ?? {};
    return (
      <div className="flex items-center gap-2">
        <Input type="number" value={v.value ?? ""} onChange={(e) => onChange({ value: Number(e.target.value), unit: v.unit ?? "months" })} className="w-20" />
        <Select value={v.unit ?? "months"} onValueChange={(u) => onChange({ value: v.value ?? 0, unit: u })}>
          <SelectTrigger size="sm" className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DURATION_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (inputType === "BOOLEAN") {
    return (
      <Select value={value === true ? "true" : value === false ? "false" : ""} onValueChange={(v) => onChange(v === "true")}>
        <SelectTrigger size="sm" className="w-28"><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Yes</SelectItem>
          <SelectItem value="false">No</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (inputType === "SINGLE_SELECT") {
    const options = getFieldOptions(field.id);
    return (
      <Select value={(value as string) ?? ""} onValueChange={onChange}>
        <SelectTrigger size="sm" className="w-44"><SelectValue placeholder="Select value" /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o.id} value={o.value}>{o.englishName}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  if (inputType === "MULTI_SELECT") {
    const options = getFieldOptions(field.id);
    const selected = (value as string[]) ?? [];
    return (
      <div className="flex flex-wrap gap-2 rounded-md border border-input px-2 py-1.5">
        {options.map((o) => (
          <label key={o.id} className="flex items-center gap-1.5 text-xs">
            <Checkbox
              checked={selected.includes(o.value)}
              onCheckedChange={() => onChange(selected.includes(o.value) ? selected.filter((v) => v !== o.value) : [...selected, o.value])}
            />
            {o.englishName}
          </label>
        ))}
      </div>
    );
  }

  if (inputType === "HIERARCHY_SELECT") {
    const hierarchy = hierarchies.find((h) => h.id === field.fieldHierarchyId);
    const nodes = hierarchy?.fieldHierarchyNodes ?? [];
    const pathLabel = (nodeId: string): string => {
      const chain: string[] = [];
      let current = nodes.find((n) => n.id === nodeId);
      while (current) {
        chain.unshift(current.englishName);
        current = current.parentNodeId ? nodes.find((n) => n.id === current!.parentNodeId) : undefined;
      }
      return chain.join(" > ");
    };
    return (
      <Select value={(value as string) ?? ""} onValueChange={onChange}>
        <SelectTrigger size="sm" className="w-56"><SelectValue placeholder="Select location" /></SelectTrigger>
        <SelectContent>
          {nodes.map((n) => <SelectItem key={n.id} value={n.value}>{pathLabel(n.id)}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  if (inputType === "DATE") {
    return <Input type="date" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} className="w-40" />;
  }

  // NUMBER / MONEY / TEXT single-value operators
  return (
    <Input
      type={inputType === "NUMBER" || inputType === "MONEY" ? "number" : "text"}
      value={(value as string | number) ?? ""}
      onChange={(e) => onChange(inputType === "NUMBER" || inputType === "MONEY" ? Number(e.target.value) : e.target.value)}
      className="w-32"
    />
  );
}
