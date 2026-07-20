import * as React from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFieldOptions, hierarchies } from "@/mock/fields.mock";
import type { DimField } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { TextField, TextareaField, SelectField, MultiSelectField, DurationField, HierarchySelectField, type DurationValue } from "@/components/ui/text-field";
import { PsgcPhLocationHierarchyField, type PsgcAddressValue } from "@/components/fields/PsgcPhLocationHierarchyField";

const PH_LOCATION_HIERARCHY_KEY = "PH_LOCATION";

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

// Adapter layer: maps a DimField (the field-config domain — options/hierarchy come from
// mock lookups keyed by field id) onto the generic, domain-independent field components in
// components/ui/text-field.tsx. Keeps the actual field-rendering logic in exactly one place
// instead of duplicated here per input type.
export function FieldInput({ field, value, onChange }: FieldInputProps) {
  const disabled = field.eGovField;
  const badge = disabled ? DEFAULT_BADGE : undefined;
  const required = field.required;

  switch (field.fieldInputType.value) {
    case "TEXT": {
      const isMultiLine = !!field.configJson?.isMultiLine;
      const TextComponent = isMultiLine ? TextareaField : TextField;
      return (
        <TextComponent
          label={field.englishName}
          value={(value as string) ?? ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
          badge={badge}
        />
      );
    }

    case "NUMBER":
      return (
        <TextField
          type="number"
          label={field.englishName}
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(v) => onChange(v === "" ? null : Number(v))}
          required={required}
          disabled={disabled}
          badge={badge}
        />
      );

    case "MONEY":
      return (
        <TextField
          type="number"
          leading="₱"
          label={field.englishName}
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(v) => onChange(v === "" ? null : Number(v))}
          required={required}
          disabled={disabled}
          badge={badge}
        />
      );

    case "DATE":
      return (
        <TextField
          type="date"
          label={field.englishName}
          value={(value as string) ?? ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
          badge={badge}
        />
      );

    case "BOOLEAN":
      return <BooleanInput field={field} value={value as boolean | undefined} onChange={onChange} disabled={disabled} badge={badge} />;

    case "SINGLE_SELECT": {
      const options = getFieldOptions(field.id).map((o) => ({ value: o.value, label: o.englishName, sublabel: o.tagalogName }));
      return (
        <SelectField
          label={field.englishName}
          value={value as string | undefined}
          onChange={onChange as (v: string) => void}
          options={options}
          required={required}
          disabled={disabled}
          badge={badge}
        />
      );
    }

    case "MULTI_SELECT": {
      const options = getFieldOptions(field.id).map((o) => ({ value: o.value, label: o.englishName, sublabel: o.tagalogName }));
      return (
        <MultiSelectField
          label={field.englishName}
          value={(value as string[]) ?? []}
          onChange={onChange as (v: string[]) => void}
          options={options}
          required={required}
          disabled={disabled}
          badge={badge}
        />
      );
    }

    case "HIERARCHY_SELECT": {
      const hierarchy = hierarchies.find((h) => h.id === field.fieldHierarchyId);

      // Special case: this hierarchy's actual location options aren't pre-seeded nodes —
      // they're fetched live from the public PSGC API (see PsgcPhLocationHierarchyField.tsx
      // / backend prisma/seeders/phLocationHierarchySeeder.ts). The stored answer is just
      // the selected barangay's PSGC code (a plain string), same as any other
      // HIERARCHY_SELECT value — condition evaluation needs no special handling.
      if (hierarchy?.key === PH_LOCATION_HIERARCHY_KEY) {
        return (
          <PsgcPhLocationHierarchyField
            label={field.englishName}
            // Only the leaf PSGC code is stored, not the full cascading selection, so an
            // already-answered field can't pre-fill its region/province/city pickers from
            // just that code alone (no reverse PSGC lookup) — it opens empty even when a
            // value exists. Picking again re-derives and overwrites the same code.
            value={null}
            onChange={(v: PsgcAddressValue | null) => onChange(v?.barangayCode ?? null)}
            required={required}
            disabled={disabled}
            badge={badge}
            hint={hierarchy.englishName}
          />
        );
      }

      const nodes = (hierarchy?.fieldHierarchyNodes ?? []).map((n) => ({
        id: n.id,
        value: n.value,
        label: n.englishName,
        sublabel: n.tagalogName,
        parentId: n.parentNodeId,
      }));
      const levelLabels = (hierarchy?.fieldHierarchyLevels ?? []).map((l) => l.englishName);
      return (
        <HierarchySelectField
          label={field.englishName}
          value={value as string | undefined}
          onChange={onChange as (v: string) => void}
          nodes={nodes}
          levelLabels={levelLabels}
          required={required}
          disabled={disabled}
          badge={badge}
          hint={hierarchy?.englishName}
        />
      );
    }

    case "DURATION":
      return (
        <DurationField
          label={field.englishName}
          value={value as DurationValue | undefined}
          onChange={onChange as (v: DurationValue) => void}
          required={required}
          disabled={disabled}
          badge={badge}
        />
      );

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
