import * as React from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { getFieldOptions } from "@/services/fieldOptions.service";
import { getHierarchies } from "@/services/fieldHierarchy.service";
import { textError, numberError, moneyError, dateError, dateNativeBounds, multiSelectError } from "@/lib/fieldValidation";
import type { DimField, DimFieldHierarchy, DimFieldOption } from "@/types/domain";
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
    <Lock className="size-2.5" /> eGovPH
  </Badge>
);

// Adapter layer: maps a DimField (the field-config domain) onto the generic,
// domain-independent field components in components/ui/text-field.tsx. Keeps the actual
// field-rendering logic in exactly one place instead of duplicated here per input type.
// Options (SINGLE_SELECT/MULTI_SELECT) and hierarchies (HIERARCHY_SELECT) are fetched for
// real per field — this used to read from @/mock/fields.mock, which meant every select/
// hierarchy answer was built against fake option lists regardless of what was actually
// configured; that's fixed here, not just the callers that render this component.
//
// configJson-driven validation (min/max length, regex, numeric/date bounds, selection
// counts) is enforced here too, mirroring backend/src/utils/condition.util.ts's
// assertAnswerMatchesFieldConfig — native input constraints (min/max/maxLength/pattern)
// plus an inline error message, so an invalid answer is caught before submit instead of
// only surfacing as a 400 from the server.
export function FieldInput({ field, value, onChange }: FieldInputProps) {
  const { token, role } = useAuth();
  // eGovField fields are only locked/synced for someone who actually has an eGov-backed
  // session to sync from. A guest ("public/no account" flow) has no account at all — there
  // is nothing to sync, so locking the field just makes it permanently unanswerable instead
  // of "pre-filled." Real accounts (USER/staff) keep the lock, matching the eventual
  // real-eGov-sync / Google-SSO-seeded-mock behavior described in the flow spec.
  const disabled = field.eGovField && role !== "GUEST";
  const badge = disabled ? DEFAULT_BADGE : undefined;
  const required = field.required;
  const inputType = field.fieldInputType.value;

  // No `!token` guard — getFieldOptions/getHierarchies fall back to the public, no-auth
  // endpoints when token is null (see their own service files), so a guest ("public/no
  // account" flow) gets real options too. This used to hard-block the fetch entirely for a
  // guest, silently rendering every SELECT/HIERARCHY_SELECT field with zero options.
  const [options, setOptions] = React.useState<DimFieldOption[]>([]);
  React.useEffect(() => {
    if (inputType !== "SINGLE_SELECT" && inputType !== "MULTI_SELECT") return;
    let cancelled = false;
    getFieldOptions(field.id, token).then((data) => !cancelled && setOptions(data));
    return () => {
      cancelled = true;
    };
  }, [field.id, inputType, token]);

  const [hierarchies, setHierarchies] = React.useState<DimFieldHierarchy[]>([]);
  React.useEffect(() => {
    if (inputType !== "HIERARCHY_SELECT") return;
    let cancelled = false;
    getHierarchies(token).then((data) => !cancelled && setHierarchies(data));
    return () => {
      cancelled = true;
    };
  }, [inputType, token]);

  switch (inputType) {
    case "TEXT": {
      const isMultiLine = !!field.configJson?.isMultiLine;
      const TextComponent = isMultiLine ? TextareaField : TextField;
      return (
        <TextComponent
          label={field.englishName}
          sublabel={field.tagalogName}
          value={(value as string) ?? ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
          badge={badge}
          maxLength={field.configJson?.maxLength as number | undefined}
          error={textError(field.configJson, (value as string) ?? "")}
        />
      );
    }

    case "NUMBER":
      return (
        <TextField
          type="number"
          label={field.englishName}
          sublabel={field.tagalogName}
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(v) => onChange(v === "" ? null : Number(v))}
          required={required}
          disabled={disabled}
          badge={badge}
          min={field.configJson?.min as number | undefined}
          max={field.configJson?.max as number | undefined}
          step={field.configJson?.allowDecimals === false ? 1 : undefined}
          error={numberError(field.configJson, value === undefined || value === null ? null : Number(value))}
        />
      );

    case "MONEY":
      return (
        <TextField
          type="number"
          leading="₱"
          label={field.englishName}
          sublabel={field.tagalogName}
          value={value === undefined || value === null ? "" : String(value)}
          onChange={(v) => onChange(v === "" ? null : Number(v))}
          required={required}
          disabled={disabled}
          badge={badge}
          min={field.configJson?.min as number | undefined}
          max={field.configJson?.max as number | undefined}
          error={moneyError(field.configJson, value === undefined || value === null ? null : Number(value))}
        />
      );

    case "DATE": {
      const bounds = dateNativeBounds(field.configJson);
      return (
        <TextField
          type="date"
          label={field.englishName}
          sublabel={field.tagalogName}
          value={(value as string) ?? ""}
          onChange={onChange}
          required={required}
          disabled={disabled}
          badge={badge}
          min={bounds.min}
          max={bounds.max}
          error={dateError(field.configJson, (value as string) ?? "")}
        />
      );
    }

    case "BOOLEAN":
      return <BooleanInput field={field} value={value as boolean | undefined} onChange={onChange} disabled={disabled} badge={badge} />;

    case "SINGLE_SELECT": {
      const selectOptions = options.map((o) => ({ value: o.value, label: o.englishName, sublabel: o.tagalogName }));
      return (
        <SelectField
          label={field.englishName}
          sublabel={field.tagalogName}
          value={value as string | undefined}
          onChange={onChange as (v: string) => void}
          options={selectOptions}
          required={required}
          disabled={disabled}
          badge={badge}
        />
      );
    }

    case "MULTI_SELECT": {
      const selectOptions = options.map((o) => ({ value: o.value, label: o.englishName, sublabel: o.tagalogName }));
      return (
        <MultiSelectField
          label={field.englishName}
          sublabel={field.tagalogName}
          value={(value as string[]) ?? []}
          onChange={onChange as (v: string[]) => void}
          options={selectOptions}
          required={required}
          disabled={disabled}
          badge={badge}
          error={multiSelectError(field.configJson, (value as string[]) ?? [])}
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
        // A real DB answer is just the leaf PSGC code (a plain string) — there's no reverse
        // PSGC lookup to rebuild region/province/city ancestors from that alone, so it opens
        // empty even when answered (picking again re-derives and overwrites the same code).
        // An eGov-sourced Residence is different: lib/egov-profile-map.ts's
        // buildResidenceValue already hands over a full PsgcAddressValue (every level's code
        // AND name, no lookup needed), so that one pre-fills directly — distinguish by shape,
        // since a plain leaf-code string and a full object both flow through this same prop.
        const psgcValue = value && typeof value === "object" ? (value as PsgcAddressValue) : null;
        return (
          <PsgcPhLocationHierarchyField
            label={field.englishName}
            sublabel={field.tagalogName}
            value={psgcValue}
            onChange={(v: PsgcAddressValue | null) => onChange(v?.barangayCode ?? null)}
            required={required}
            disabled={disabled}
            badge={badge}
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
          sublabel={field.tagalogName}
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
          sublabel={field.tagalogName}
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
          {field.tagalogName && <span className="ml-1 text-[9px] font-normal italic text-muted-foreground/70">{field.tagalogName}</span>}
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
