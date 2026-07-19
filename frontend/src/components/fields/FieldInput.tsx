import * as React from "react";
import { Lock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFieldOptions, hierarchies } from "@/mock/fields.mock";
import type { DimField } from "@/types/domain";
import { FloatingLabelField } from "@/components/fields/FloatingLabelField";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface FieldInputProps {
  field: DimField;
  value: unknown;
  onChange: (value: unknown) => void;
}

const DEFAULT_BADGE = (
  <Badge variant="secondary" className="gap-1 border border-border bg-background text-[10px] text-muted-foreground shadow-sm">
    <Lock className="size-2.5" /> Synced from eGovPH
  </Badge>
);

export function FieldInput({ field, value, onChange }: FieldInputProps) {
  const disabled = field.default;
  const badge = disabled ? DEFAULT_BADGE : undefined;

  switch (field.fieldInputType.value) {
    case "TEXT":
      return (
        <FloatingLabelField label={field.englishName} hasValue={!!value} required={field.required} disabled={disabled} badge={badge}>
          <Input
            value={(value as string) ?? ""}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
          />
        </FloatingLabelField>
      );

    case "NUMBER":
      return (
        <FloatingLabelField label={field.englishName} hasValue={value !== undefined && value !== null && value !== ""} required={field.required} disabled={disabled} badge={badge}>
          <Input
            type="number"
            value={(value as number) ?? ""}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
          />
        </FloatingLabelField>
      );

    case "MONEY":
      return (
        <FloatingLabelField label={field.englishName} hasValue={value !== undefined && value !== null && value !== ""} required={field.required} disabled={disabled} badge={badge}>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">₱</span>
            <Input
              type="number"
              value={(value as number) ?? ""}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
              className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
            />
          </div>
        </FloatingLabelField>
      );

    case "DATE":
      return (
        <FloatingLabelField label={field.englishName} hasValue={!!value} required={field.required} disabled={disabled} badge={badge}>
          <Input
            type="date"
            value={(value as string) ?? ""}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="h-auto border-0 p-0 shadow-none focus-visible:ring-0"
          />
        </FloatingLabelField>
      );

    case "BOOLEAN":
      return <BooleanInput field={field} value={value as boolean | undefined} onChange={onChange} disabled={disabled} badge={badge} />;

    case "SINGLE_SELECT":
      return <SingleSelectInput field={field} value={value as string | undefined} onChange={onChange} disabled={disabled} badge={badge} />;

    case "MULTI_SELECT":
      return <MultiSelectInput field={field} value={(value as string[]) ?? []} onChange={onChange} disabled={disabled} badge={badge} />;

    case "HIERARCHY_SELECT":
      return <HierarchySelectInput field={field} value={value as string | undefined} onChange={onChange} disabled={disabled} badge={badge} />;

    case "DURATION":
      return <DurationInput field={field} value={value as { value: number; unit: string } | undefined} onChange={onChange} disabled={disabled} badge={badge} />;

    case "REPEATER_GROUP":
      return null; // rendered by RepeaterGroupInput (see FieldForm), not directly here

    default:
      return null;
  }
}

// --- BOOLEAN: Yes/No segmented toggle. No "filled" state to float a label against, so
// the label sits above the control instead of floating inside it.
function BooleanInput({
  field,
  value,
  onChange,
  disabled,
  badge,
}: {
  field: DimField;
  value: boolean | undefined;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          {field.englishName}
          {field.required && <span className="text-destructive"> *</span>}
        </label>
        {badge}
      </div>
      <div className="inline-flex w-fit rounded-lg border border-input p-1">
        {[
          { label: "Yes", val: true },
          { label: "No", val: false },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.val)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              value === opt.val ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SingleSelectInput({
  field,
  value,
  onChange,
  disabled,
  badge,
}: {
  field: DimField;
  value: string | undefined;
  onChange: (v: string) => void;
  disabled?: boolean;
  badge?: React.ReactNode;
}) {
  const options = getFieldOptions(field.id);

  return (
    <FloatingLabelField label={field.englishName} hasValue={!!value} required={field.required} disabled={disabled} badge={badge}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-auto w-full border-0 p-0 shadow-none focus-visible:ring-0 [&>svg]:ml-auto">
          <SelectValue placeholder="" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.id} value={opt.value}>
              {opt.englishName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FloatingLabelField>
  );
}

function MultiSelectInput({
  field,
  value,
  onChange,
  disabled,
  badge,
}: {
  field: DimField;
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
  badge?: React.ReactNode;
}) {
  const options = getFieldOptions(field.id);

  const toggle = (optValue: string) => {
    onChange(value.includes(optValue) ? value.filter((v) => v !== optValue) : [...value, optValue]);
  };

  return (
    <FloatingLabelField label={field.englishName} hasValue={value.length > 0} required={field.required} disabled={disabled} badge={badge}>
      <Popover>
        <PopoverTrigger disabled={disabled} className="flex min-h-6 w-full flex-wrap items-center gap-1 text-left disabled:cursor-not-allowed">
          {value.length === 0 ? (
            <span className="text-sm text-muted-foreground">&nbsp;</span>
          ) : (
            options
              .filter((o) => value.includes(o.value))
              .map((o) => (
                <Badge key={o.id} variant="secondary" className="gap-1">
                  {o.englishName}
                  <X
                    className="size-3 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(o.value);
                    }}
                  />
                </Badge>
              ))
          )}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-2">
          <div className="flex flex-col gap-1">
            {options.map((opt) => (
              <label key={opt.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                <Checkbox checked={value.includes(opt.value)} onCheckedChange={() => toggle(opt.value)} />
                {opt.englishName}
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </FloatingLabelField>
  );
}

function HierarchySelectInput({
  field,
  value,
  onChange,
  disabled,
  badge,
}: {
  field: DimField;
  value: string | undefined;
  onChange: (v: string) => void;
  disabled?: boolean;
  badge?: React.ReactNode;
}) {
  const hierarchy = hierarchies.find((h) => h.id === field.fieldHierarchyId);
  const nodes = hierarchy?.fieldHierarchyNodes ?? [];
  const levels = hierarchy?.fieldHierarchyLevels ?? [];

  // Reconstruct the selected node's ancestor chain so each level's select shows the
  // right pre-selection when re-opening an already-answered field.
  const selectedNode = nodes.find((n) => n.value === value);
  const chain: string[] = [];
  let walker = selectedNode;
  while (walker) {
    chain.unshift(walker.id);
    walker = walker.parentNodeId ? nodes.find((n) => n.id === walker!.parentNodeId) : undefined;
  }

  const [path, setPath] = React.useState<string[]>(chain);

  const handleSelectAt = (depth: number, nodeId: string) => {
    const newPath = [...path.slice(0, depth), nodeId];
    setPath(newPath);
    const node = nodes.find((n) => n.id === nodeId);
    const isLeaf = !nodes.some((n) => n.parentNodeId === nodeId);
    if (isLeaf && node) onChange(node.value);
  };

  const columns: { parentId: string | null }[] = [{ parentId: null }, ...path.map((id) => ({ parentId: id }))];

  return (
    <FloatingLabelField label={field.englishName} hasValue={!!value} required={field.required} disabled={disabled} badge={badge} hint={hierarchy?.englishName}>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1">
        {columns.map((col, depth) => {
          const options = nodes.filter((n) => n.parentNodeId === col.parentId);
          if (options.length === 0) return null;
          return (
            <Select key={depth} value={path[depth]} onValueChange={(v) => handleSelectAt(depth, v)} disabled={disabled}>
              <SelectTrigger size="sm" className="h-8 min-w-32 shrink-0 border-border bg-muted/40">
                <SelectValue placeholder={levels[depth]?.englishName ?? "Select"} />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.englishName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        })}
      </div>
    </FloatingLabelField>
  );
}

const DURATION_UNITS = [
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "years", label: "Years" },
];

function DurationInput({
  field,
  value,
  onChange,
  disabled,
  badge,
}: {
  field: DimField;
  value: { value: number; unit: string } | undefined;
  onChange: (v: { value: number; unit: string }) => void;
  disabled?: boolean;
  badge?: React.ReactNode;
}) {
  const unit = value?.unit ?? "months";

  return (
    <FloatingLabelField label={field.englishName} hasValue={value?.value !== undefined} required={field.required} disabled={disabled} badge={badge}>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={value?.value ?? ""}
          disabled={disabled}
          onChange={(e) => onChange({ value: e.target.value === "" ? 0 : Number(e.target.value), unit })}
          className="h-auto w-20 border-0 p-0 shadow-none focus-visible:ring-0"
        />
        <Select value={unit} onValueChange={(u) => onChange({ value: value?.value ?? 0, unit: u })} disabled={disabled}>
          <SelectTrigger size="sm" className="h-7 border-0 bg-muted/50 shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DURATION_UNITS.map((u) => (
              <SelectItem key={u.value} value={u.value}>
                {u.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FloatingLabelField>
  );
}
