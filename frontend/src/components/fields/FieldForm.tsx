import * as React from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getSubfields } from "@/services/fields.service";
import { useAnswers } from "@/lib/answers-store";
import { useAlert } from "@/lib/alert-store";
import { renderableFields } from "@/lib/field-visibility";
import { getEgovRepeaterRows } from "@/lib/egov-profile-map";
import type { DimField } from "@/types/domain";
import { FieldInput } from "@/components/fields/FieldInput";
import { EgovRepeaterPreview } from "@/components/fields/EgovRepeaterPreview";
import { FloatingLabelField } from "@/components/ui/floating-label-field";
import { Button } from "@/components/ui/button";

interface FieldFormProps {
  fields: DimField[];
  values: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
  columns?: 1 | 2;
  /**
   * Marks every non-REPEATER_GROUP field inert (read-only, unfocusable) — e.g. ProfilePage's
   * view-before-you-toggle-Edit state. REPEATER_GROUP sections are deliberately never
   * inert: a real one saves each cell on its own debounced timer regardless of this toggle
   * (see RepeaterGroupInput's own comment), and an eGov preview table still needs to stay
   * horizontally scrollable in "view only" mode — wrapping the whole form in one blanket
   * `inert` div (the previous approach) blocked scrolling inside it too, since `inert`
   * disables pointer interaction for its entire subtree with no CSS escape hatch.
   */
  locked?: boolean;
}

// 2-column grid of FieldInputs (Desktop 10 / 11's form pattern), used by both the initial
// Form page and Answer More. REPEATER_GROUP fields span the full width and render as a
// repeatable list of sub-forms instead of a single control.
//
// Two things happen here that the raw `fields` prop doesn't already guarantee: anchored
// "Children Dependents" are reordered to render immediately after the field they're
// anchored to (flattenAnchorOrder — same grouping SortableFieldList.tsx uses in the admin
// UI), and every field's own dynamicCondition is evaluated live against `values` so a
// field genuinely appears/disappears as the applicant answers (isFieldVisible) instead of
// dynamicCondition being purely a server-side-at-submit-time concept.
export function FieldForm({ fields, values, onChange, columns = 2, locked = false }: FieldFormProps) {
  const { egovProfile } = useAuth();
  const orderedFields = renderableFields(fields, values);

  return (
    <div className={columns === 2 ? "grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2" : "flex flex-col gap-6"}>
      {orderedFields.map((field) => {
        if (field.fieldInputType.value !== "REPEATER_GROUP") {
          return (
            <div key={field.id} inert={locked || undefined}>
              <FieldInput field={field} value={values[field.id]} onChange={(v) => onChange(field.id, v)} />
            </div>
          );
        }

        // An eGovField repeater (currently only "Educational Attainment") can't reuse the
        // normal DB-backed RepeaterGroupInput — this data never gets written as real
        // FctUserFieldAnswerGroup rows, so there'd be nothing for it to read. Falls back to
        // the normal table when there's no eGov session/data for this field (e.g. a
        // Google-SSO user, or before the applicant has synced anything).
        const egovRows = field.eGovField ? getEgovRepeaterRows(field.englishName, egovProfile) : null;

        return (
          <div key={field.id} className="sm:col-span-2">
            {egovRows ? <EgovRepeaterPreview field={field} rows={egovRows} /> : <RepeaterGroupInput field={field} />}
          </div>
        );
      })}
    </div>
  );
}

// Renders as a real table — one column per subfield, one row per "instance" (e.g. one
// dependent, one prior employer) — with an "Add Row" button that creates a fresh, entirely
// blank row via POST /field-answers/groups. Each cell is still a plain FieldInput; only the
// layout around it is new (the previous version stacked rows as separate cards).
function RepeaterGroupInput({ field }: { field: DimField }) {
  const { token } = useAuth();
  const { groups, answers, addAnswerGroup, deleteAnswerGroup, refetchGroups, submit } = useAnswers();
  const { showApiError } = useAlert();
  const [subfields, setSubfields] = React.useState<DimField[]>([]);
  const [adding, setAdding] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    // No `!token` guard — getSubfields falls back to the public, no-auth field list when
    // token is null, so a guest's REPEATER_GROUP fields load their subfields too (this used
    // to hard-block the fetch, leaving a guest's repeater with no columns to fill in).
    let cancelled = false;
    getSubfields(field.id, token).then((result) => {
      if (!cancelled) setSubfields(result);
    });
    refetchGroups(field.id);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.id, token]);

  const rows = groups.filter((g) => g.fieldId === field.id);

  // Backend enforces the real limit (fieldAnswer.service.ts's createAnswerGroup) — this is
  // just proactive UX so the button doesn't invite a click that's just going to fail.
  const maxRows = field.configJson?.maxRows as number | undefined;
  const atMax = typeof maxRows === "number" && rows.length >= maxRows;

  // A cell's onChange used to call `submit` directly, and its displayed value came straight
  // from `answers` (server-confirmed state) — so every keystroke waited on a full PUT
  // round-trip before the typed character actually appeared (visible input lag, worse than
  // the debounce below on a slow connection). `localOverrides` shows the typed value
  // instantly; the debounced save reconciles it with the server, then drops the override so
  // `answers` takes back over as the source of truth.
  const [localOverrides, setLocalOverrides] = React.useState<Record<string, unknown>>({});
  const saveTimers = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const cellKey = (repeaterGroupId: string, subfieldId: string) => `${repeaterGroupId}:${subfieldId}`;

  React.useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const valueFor = (repeaterGroupId: string, subfieldId: string) => {
    const key = cellKey(repeaterGroupId, subfieldId);
    if (key in localOverrides) return localOverrides[key];
    return answers.find((a) => a.repeaterGroupId === repeaterGroupId && a.fieldId === subfieldId)?.value;
  };

  const handleCellChange = (repeaterGroupId: string, subfieldId: string, value: unknown) => {
    const key = cellKey(repeaterGroupId, subfieldId);
    setLocalOverrides((prev) => ({ ...prev, [key]: value }));

    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(async () => {
      try {
        await submit([{ fieldId: subfieldId, value, repeaterGroupId }]);
      } catch (err) {
        showApiError(err);
      }
      setLocalOverrides((prev) => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 500);
  };

  const handleAddRow = async () => {
    setAdding(true);
    try {
      await addAnswerGroup(field.id);
    } catch (err) {
      showApiError(err);
    }
    setAdding(false);
  };

  const handleDeleteRow = async (rowId: string) => {
    // Cancel any cell in this row still waiting on its debounced save — otherwise it fires
    // after the row (and its DB-side group) is already gone, surfacing a spurious
    // ANSWER_GROUP_NOT_FOUND error for an edit the user no longer cares about.
    const prefix = `${rowId}:`;
    for (const key of Object.keys(saveTimers.current)) {
      if (key.startsWith(prefix)) {
        clearTimeout(saveTimers.current[key]);
        delete saveTimers.current[key];
      }
    }
    setLocalOverrides((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) if (key.startsWith(prefix)) delete next[key];
      return next;
    });

    setDeletingId(rowId);
    try {
      await deleteAnswerGroup(rowId);
    } catch (err) {
      showApiError(err);
    }
    setDeletingId(null);
  };

  return (
    <FloatingLabelField
      label={field.englishName}
      sublabel={field.tagalogName}
      hasValue
      disableClickCascade
      badge={
        // Hidden (not just disabled) once at the configured max — nothing left to invite a
        // click toward. atMax is false whenever maxRows is unset, so this never hides here.
        !atMax && (
          <Button type="button" size="sm" variant="outline" onClick={handleAddRow} disabled={adding} className="h-6 gap-1 px-2 text-[11px]">
            {adding ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />} Add Row
          </Button>
        )
      }
    >
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          None added yet — click "Add Row" to add {field.englishName.toLowerCase()}.
        </p>
      ) : (
        <div className="thin-scrollbar -mx-3 overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="w-10 px-3 py-2 text-left text-xs font-semibold text-muted-foreground">#</th>
                {subfields.map((sub) => (
                  <th key={sub.id} className="min-w-48 px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                    {sub.englishName}
                    {sub.required && <span className="text-destructive"> *</span>}
                  </th>
                ))}
                <th className="w-10 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, index) => (
                <tr key={row.id}>
                  <td className="px-3 py-3 align-top text-xs font-semibold text-muted-foreground">{index + 1}</td>
                  {subfields.map((sub) => (
                    <td key={sub.id} className="min-w-48 px-3 py-3 align-top">
                      <FieldInput
                        field={sub}
                        value={valueFor(row.id, sub.id)}
                        onChange={(v) => handleCellChange(row.id, sub.id, v)}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(row.id)}
                      disabled={deletingId === row.id}
                      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-60"
                      aria-label={`Delete row ${index + 1}`}
                    >
                      {deletingId === row.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {atMax && <p className="pt-2 text-xs text-muted-foreground">Maximum of {maxRows} row{maxRows === 1 ? "" : "s"} reached.</p>}
    </FloatingLabelField>
  );
}
