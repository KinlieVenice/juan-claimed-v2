import * as React from "react";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getSubfields } from "@/services/fields.service";
import { FieldInput } from "@/components/fields/FieldInput";
import { FloatingLabelField } from "@/components/ui/floating-label-field";
import { Badge } from "@/components/ui/badge";
import type { DimField } from "@/types/domain";

// Same table markup/container as FieldForm.tsx's RepeaterGroupInput — deliberately, so an
// eGov-backed REPEATER_GROUP field (currently only "Educational Attainment") looks
// identical to a normal one. The difference is entirely in the data source: `rows` come
// from the live eGov profile (see lib/egov-profile-map.ts), never from
// FctUserFieldAnswerGroup — no "Add Row" here (the eGovPH badge takes that corner instead),
// and every cell is permanently locked (FieldInput already does this for any eGovField —
// this data can only ever change in the eGov app itself, never here). Deliberately never
// wrapped in FieldForm's `locked`/inert treatment either — this table must stay
// horizontally scrollable even in Profile's "view only" state.
export function EgovRepeaterPreview({ field, rows }: { field: DimField; rows: Record<string, unknown>[] }) {
  const { token } = useAuth();
  const [subfields, setSubfields] = React.useState<DimField[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    getSubfields(field.id, token).then((result) => {
      if (!cancelled) setSubfields(result);
    });
    return () => {
      cancelled = true;
    };
  }, [field.id, token]);

  return (
    <FloatingLabelField
      label={field.englishName}
      hasValue
      disableClickCascade
      badge={
        <Badge variant="secondary" className="gap-1 border border-border bg-background text-[10px] text-muted-foreground shadow-sm">
          <Lock className="size-2.5" /> eGovPH
        </Badge>
      }
    >
      {rows.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">None on file with eGovPH.</p>
      ) : (
        <div className="thin-scrollbar -mx-3 overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="w-10 px-3 py-2 text-left text-xs font-semibold text-muted-foreground">#</th>
                {subfields.map((sub) => (
                  <th key={sub.id} className="min-w-48 px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
                    {sub.englishName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, index) => (
                <tr key={index}>
                  <td className="px-3 py-3 align-top text-xs font-semibold text-muted-foreground">{index + 1}</td>
                  {subfields.map((sub) => (
                    <td key={sub.id} className="min-w-48 px-3 py-3 align-top">
                      <FieldInput field={sub} value={row[sub.englishName] ?? null} onChange={() => {}} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </FloatingLabelField>
  );
}
