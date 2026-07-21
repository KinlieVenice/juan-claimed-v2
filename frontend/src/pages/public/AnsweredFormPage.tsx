import * as React from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAnswers } from "@/lib/answers-store";
import { getFields } from "@/services/fields.service";
import { FieldForm } from "@/components/fields/FieldForm";
import { ApplyChrome, ApplyFooter } from "@/components/apply/ApplyChrome";
import { ClayCard } from "@/components/apply/ClayCard";
import type { DimField } from "@/types/domain";

// Guest counterpart of ProfilePage — "See the answered form" from the benefits page, since
// a signed-out visitor has no account to attach a real Profile to. Same idea (every field
// they've actually answered so far, editable), just generic instead of an account page —
// answers still live only in this browser's localStorage (see answers-store.tsx).
export function AnsweredFormPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { answers, groups, answersMap, submit } = useAnswers();
  const [fields, setFields] = React.useState<DimField[] | null>(null);

  React.useEffect(() => {
    getFields(token).then(setFields);
  }, [token]);

  const answeredFieldIds = React.useMemo(
    () => new Set(answers.filter((a) => a.repeaterGroupId === null && a.value !== null).map((a) => a.fieldId)),
    [answers],
  );

  const answeredFields = (fields ?? [])
    .filter((f) => f.parentFieldId === null)
    .filter((f) => (f.fieldInputType.value === "REPEATER_GROUP" ? groups.some((g) => g.fieldId === f.id) : answeredFieldIds.has(f.id)))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleChange = (fieldId: string, value: unknown) => submit([{ fieldId, value }]);

  return (
    <div className="apply-bg min-h-screen overflow-x-hidden text-slate-800">
      <ApplyChrome />

      <section className="mx-auto max-w-4xl px-4 py-12 md:px-5 md:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <span className="clay-blue inline-block px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-[color:var(--color-ph-blue)] uppercase md:text-[11px]">
              Your answers
            </span>
            <h1 className="mt-4 font-display text-3xl leading-[1.05] font-black tracking-tight text-slate-900 md:text-4xl">
              What you've told us so far
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">
              Saved only in this browser — nothing here is sent anywhere unless you sign in.
            </p>
          </div>

          {fields === null ? (
            <div className="clay flex items-center justify-center p-16 text-sm text-slate-500">
              <Loader2 className="mr-2 size-4 animate-spin" /> Loading…
            </div>
          ) : answeredFields.length === 0 ? (
            <ClayCard variant="blue" className="flex flex-col items-center gap-4 p-10 text-center">
              <div className="clay-yellow grid h-14 w-14 place-items-center">
                <FileText className="size-6 text-[color:var(--color-ph-blue)]" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900">Nothing answered yet</h3>
                <p className="mt-1 max-w-md text-sm text-slate-600">Take the quiz to start building your answers.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/form")}
                className="clay-blue px-6 py-3 text-sm font-bold text-[color:var(--color-ph-blue)] transition hover:-translate-y-1"
              >
                Go to the quiz
              </button>
            </ClayCard>
          ) : (
            <ClayCard variant="plain" className="p-6 md:p-8">
              <FieldForm fields={answeredFields} values={answersMap} onChange={handleChange} />
            </ClayCard>
          )}
        </div>
      </section>

      <ApplyFooter />
    </div>
  );
}
