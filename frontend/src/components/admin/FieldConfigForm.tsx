import * as React from "react";
import type { FieldInputTypeValue } from "@/types/domain";
import { TextField, SelectField, MultiSelectField, DEFAULT_DURATION_UNITS } from "@/components/ui/text-field";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FieldConfigFormProps {
  inputTypeValue: FieldInputTypeValue;
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

const REGEX_PRESETS: { value: string; label: string; pattern: string; hint: string }[] = [
  { value: "custom", label: "Custom pattern", pattern: "", hint: "" },
  { value: "email", label: "Email address", pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", hint: "Must be a valid email address." },
  { value: "ph_mobile", label: "PH mobile number", pattern: "^\\+639\\d{9}$", hint: "Must be a valid PH mobile number (e.g. +639171234567)." },
  { value: "alphanumeric", label: "Letters and numbers only", pattern: "^[a-zA-Z0-9]+$", hint: "Letters and numbers only, no spaces or symbols." },
  { value: "letters_only", label: "Letters only", pattern: "^[a-zA-Z\\s]+$", hint: "Letters only." },
  { value: "numbers_only", label: "Numbers only", pattern: "^[0-9]+$", hint: "Numbers only." },
];

function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

function TextConfigFields({ value, onChange }: { value: Record<string, unknown>; onChange: (value: Record<string, unknown>) => void }) {
  const set = (patch: Record<string, unknown>) => onChange({ ...value, ...patch });
  const regex = (value.regex as string) ?? "";
  const matchedPreset = REGEX_PRESETS.find((p) => p.pattern === regex && p.pattern !== "");
  const [preset, setPreset] = React.useState(matchedPreset?.value ?? "custom");
  const [sample, setSample] = React.useState("");

  const applyPreset = (presetValue: string) => {
    setPreset(presetValue);
    const found = REGEX_PRESETS.find((p) => p.value === presetValue);
    if (found && found.value !== "custom") {
      set({ regex: found.pattern, regexLabel: found.hint });
    }
  };

  const regexValid = regex === "" || isValidRegex(regex);
  const sampleMatches = regex && regexValid && sample ? new RegExp(regex).test(sample) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Min length"
          type="number"
          value={value.minLength === undefined ? "" : String(value.minLength)}
          onChange={(v) => set({ minLength: v === "" ? undefined : Number(v) })}
        />
        <TextField
          label="Max length"
          type="number"
          value={value.maxLength === undefined ? "" : String(value.maxLength)}
          onChange={(v) => set({ maxLength: v === "" ? undefined : Number(v) })}
        />
      </div>

      <TextField label="Placeholder" value={(value.placeholder as string) ?? ""} onChange={(v) => set({ placeholder: v || undefined })} />

      <ToggleRow label="Multi-line (textarea)" checked={!!value.isMultiLine} onCheckedChange={(v) => set({ isMultiLine: v })} />

      <div className="space-y-2 rounded-lg border border-border p-3">
        <Label className="text-xs font-semibold text-foreground">Pattern (regex) builder</Label>
        <SelectField label="Preset" value={preset} onChange={applyPreset} options={REGEX_PRESETS.map((p) => ({ value: p.value, label: p.label }))} />

        <TextField
          label="Pattern"
          value={regex}
          onChange={(v) => {
            setPreset("custom");
            set({ regex: v || undefined });
          }}
          error={regex && !regexValid ? "Not a valid regular expression." : undefined}
          hint="Raw pattern, no surrounding slashes."
        />
        <TextField label="Message shown to applicants" value={(value.regexLabel as string) ?? ""} onChange={(v) => set({ regexLabel: v || undefined })} />

        {regex && regexValid && (
          <div className="space-y-1">
            <TextField label="Test a sample value" value={sample} onChange={setSample} />
            {sample && (
              <p className={sampleMatches ? "text-xs font-medium text-emerald-600" : "text-xs font-medium text-destructive"}>
                {sampleMatches ? "Matches the pattern." : "Does not match the pattern."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// A field's per-input-type validation/display config, stored as DimField.configJson.
// Shape mirrors backend/src/requests/fieldConfig.request.ts's per-type zod schemas.
export function FieldConfigForm({ inputTypeValue, value, onChange }: FieldConfigFormProps) {
  const set = (patch: Record<string, unknown>) => onChange({ ...value, ...patch });

  if (inputTypeValue === "TEXT") {
    return <TextConfigFields value={value} onChange={onChange} />;
  }

  if (inputTypeValue === "NUMBER") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Min" type="number" value={value.min === undefined ? "" : String(value.min)} onChange={(v) => set({ min: v === "" ? undefined : Number(v) })} />
          <TextField label="Max" type="number" value={value.max === undefined ? "" : String(value.max)} onChange={(v) => set({ max: v === "" ? undefined : Number(v) })} />
        </div>
        <TextField label="Placeholder" value={(value.placeholder as string) ?? ""} onChange={(v) => set({ placeholder: v || undefined })} />
        <ToggleRow label="Allow decimals" checked={!!value.allowDecimals} onCheckedChange={(c) => set({ allowDecimals: c })} />
        <ToggleRow label="Allow negative numbers" checked={!!value.allowNegative} onCheckedChange={(c) => set({ allowNegative: c })} />
      </div>
    );
  }

  if (inputTypeValue === "MONEY") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Min" type="number" value={value.min === undefined ? "" : String(value.min)} onChange={(v) => set({ min: v === "" ? undefined : Number(v) })} />
          <TextField label="Max" type="number" value={value.max === undefined ? "" : String(value.max)} onChange={(v) => set({ max: v === "" ? undefined : Number(v) })} />
        </div>
        <TextField label="Currency symbol" value={(value.currencySymbol as string) ?? ""} onChange={(v) => set({ currencySymbol: v || undefined })} />
      </div>
    );
  }

  if (inputTypeValue === "DATE") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Earliest date" type="date" value={(value.minDate as string) ?? ""} onChange={(v) => set({ minDate: v || undefined })} />
          <TextField label="Latest date" type="date" value={(value.maxDate as string) ?? ""} onChange={(v) => set({ maxDate: v || undefined })} />
        </div>
        <ToggleRow label="Allow future dates" checked={!!value.allowFuture} onCheckedChange={(c) => set({ allowFuture: c })} />
        <ToggleRow label="Allow past dates" checked={!!value.allowPast} onCheckedChange={(c) => set({ allowPast: c })} />
        <ToggleRow label="Allow time selection" checked={!!value.allowTime} onCheckedChange={(c) => set({ allowTime: c })} />
      </div>
    );
  }

  if (inputTypeValue === "DURATION") {
    const allowedUnits = (value.allowedUnits as string[] | undefined) ?? DEFAULT_DURATION_UNITS.map((u) => u.value);
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Min value" type="number" value={value.minValue === undefined ? "" : String(value.minValue)} onChange={(v) => set({ minValue: v === "" ? undefined : Number(v) })} />
          <TextField label="Max value" type="number" value={value.maxValue === undefined ? "" : String(value.maxValue)} onChange={(v) => set({ maxValue: v === "" ? undefined : Number(v) })} />
        </div>
        <MultiSelectField label="Allowed units" value={allowedUnits} onChange={(v) => set({ allowedUnits: v })} options={DEFAULT_DURATION_UNITS} />
      </div>
    );
  }

  if (inputTypeValue === "MULTI_SELECT") {
    return (
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Min selections"
          type="number"
          value={value.minSelections === undefined ? "" : String(value.minSelections)}
          onChange={(v) => set({ minSelections: v === "" ? undefined : Number(v) })}
        />
        <TextField
          label="Max selections"
          type="number"
          value={value.maxSelections === undefined ? "" : String(value.maxSelections)}
          onChange={(v) => set({ maxSelections: v === "" ? undefined : Number(v) })}
        />
      </div>
    );
  }

  if (inputTypeValue === "REPEATER_GROUP") {
    return (
      <TextField
        label="Max rows"
        type="number"
        min={1}
        step={1}
        value={value.maxRows === undefined ? "" : String(value.maxRows)}
        onChange={(v) => {
          if (v === "") {
            set({ maxRows: undefined });
            return;
          }
          // Number("12-34") / Number("-5") both fail this the same way a stray "-"
          // typed mid-string would — rejected outright rather than silently coerced,
          // since a repeater's row cap can never be negative or malformed.
          const parsed = Math.trunc(Number(v));
          if (!Number.isFinite(parsed) || parsed < 1) return;
          set({ maxRows: parsed });
        }}
        hint="Leave blank for unlimited. Enforced server-side, not just a frontend hint."
      />
    );
  }

  return <p className="text-sm text-muted-foreground">No additional configuration for this field type.</p>;
}

function ToggleRow({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
      <Label className="text-sm font-normal text-foreground">{label}</Label>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
