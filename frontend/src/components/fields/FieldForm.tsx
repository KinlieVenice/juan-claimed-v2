import { Plus, Trash2 } from "lucide-react";
import { getSubfields } from "@/mock/fields.mock";
import { useAnswers } from "@/lib/answers-store";
import type { DimField } from "@/types/domain";
import { FieldInput } from "@/components/fields/FieldInput";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FieldFormProps {
  fields: DimField[];
  values: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
  columns?: 1 | 2;
}

// 2-column grid of FieldInputs (Desktop 10 / 11's form pattern), used by both the initial
// Form page and Answer More. REPEATER_GROUP fields span the full width and render as a
// repeatable list of sub-forms instead of a single control.
export function FieldForm({ fields, values, onChange, columns = 2 }: FieldFormProps) {
  return (
    <div className={columns === 2 ? "grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2" : "flex flex-col gap-6"}>
      {fields.map((field) =>
        field.fieldInputType.value === "REPEATER_GROUP" ? (
          <div key={field.id} className="sm:col-span-2">
            <RepeaterGroupInput field={field} />
          </div>
        ) : (
          <FieldInput key={field.id} field={field} value={values[field.id]} onChange={(v) => onChange(field.id, v)} />
        ),
      )}
    </div>
  );
}

function RepeaterGroupInput({ field }: { field: DimField }) {
  const { groups, answers, addAnswerGroup, submit } = useAnswers();
  const subfields = getSubfields(field.id);
  const rows = groups.filter((g) => g.fieldId === field.id);

  const valueFor = (repeaterGroupId: string, subfieldId: string) =>
    answers.find((a) => a.repeaterGroupId === repeaterGroupId && a.fieldId === subfieldId)?.value;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{field.englishName}</p>
          <p className="text-xs text-muted-foreground">{field.description}</p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => addAnswerGroup(field.id)}>
          <Plus /> Add another
        </Button>
      </div>

      {rows.length === 0 && (
        <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          None added yet.
        </p>
      )}

      {rows.map((row, index) => (
        <Card key={row.id} className="gap-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {field.englishName} #{index + 1}
            </p>
            <Button type="button" size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-destructive">
              <Trash2 className="size-3.5" />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {subfields.map((sub) => (
              <FieldInput
                key={sub.id}
                field={sub}
                value={valueFor(row.id, sub.id)}
                onChange={(v) => submit([{ fieldId: sub.id, value: v, repeaterGroupId: row.id }])}
              />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
