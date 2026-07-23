import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";
import type { FieldOptionInput, FieldOptionUpdateInput } from "@/services/fields.service";

const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`);

export interface LocalOption {
  localId: string;
  id?: string;
  englishName: string;
  tagalogName: string;
  englishDescription: string;
  tagalogDescription: string;
  /** The real backend value string — only present once this option is actually saved
   * (generated server-side at creation). A brand-new, not-yet-saved option has none yet. */
  value?: string;
}

export const emptyOption = (): LocalOption => ({ localId: newId(), englishName: "", tagalogName: "", englishDescription: "", tagalogDescription: "" });

export function toOptionPayload(o: LocalOption): FieldOptionInput | FieldOptionUpdateInput {
  const base = { englishName: o.englishName, tagalogName: o.tagalogName, englishDescription: o.englishDescription, tagalogDescription: o.tagalogDescription };
  return o.id ? { ...base, id: o.id } : base;
}

// Options editor for SINGLE_SELECT/MULTI_SELECT fields — shared by the top-level field
// form and each REPEATER_GROUP subfield's own options (a subfield can be a SELECT type
// too, with its own option list, independent of the parent's).
export function OptionsEditor({
  options,
  onChange,
  onRemoveExisting,
  token,
  disabled,
}: {
  options: LocalOption[];
  onChange: (options: LocalOption[]) => void;
  onRemoveExisting: (id: string) => void;
  /** Powers each option's English -> Tagalog auto-translate (see useAutoTranslate.ts). */
  token: string | null | undefined;
  /** View mode — hides Add/remove chrome (see BenefitItemListEditor.tsx's identical prop). */
  disabled?: boolean;
}) {
  const updateOption = (localId: string, patch: Partial<LocalOption>) => {
    onChange(options.map((o) => (o.localId === localId ? { ...o, ...patch } : o)));
  };

  const removeOption = (option: LocalOption) => {
    if (option.id) onRemoveExisting(option.id);
    onChange(options.filter((o) => o.localId !== option.localId));
  };

  return (
    <div className="space-y-3">
      {options.length === 0 && <p className="text-xs text-muted-foreground">No options yet — add one below.</p>}

      {options.map((option) => (
        <OptionRow key={option.localId} option={option} onChange={(patch) => updateOption(option.localId, patch)} onRemove={() => removeOption(option)} token={token} disabled={disabled} />
      ))}

      {!disabled && (
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...options, emptyOption()])}>
          <Plus /> Add Option
        </Button>
      )}
    </div>
  );
}

function OptionRow({
  option,
  onChange,
  onRemove,
  token,
  disabled,
}: {
  option: LocalOption;
  onChange: (patch: Partial<LocalOption>) => void;
  onRemove: () => void;
  token: string | null | undefined;
  disabled?: boolean;
}) {
  const nameTranslate = useAutoTranslate({ sourceValue: option.englishName, onTargetChange: (v) => onChange({ tagalogName: v }), token, enabled: !disabled });

  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
      <TextField label="English Name" value={option.englishName} onChange={(v) => onChange({ englishName: v })} required />
      <TextField label="Tagalog Name" value={option.tagalogName} onChange={nameTranslate.handleTargetChange} required badge={nameTranslate.badge} />
      {!disabled && (
        <div className="sm:col-span-2 flex justify-end">
          <Button type="button" size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={onRemove}>
            <Trash2 />
          </Button>
        </div>
      )}
    </div>
  );
}
