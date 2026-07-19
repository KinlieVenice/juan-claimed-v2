import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { fields } from "@/mock/fields.mock";
import { useAnswers } from "@/lib/answers-store";
import { FieldForm } from "@/components/fields/FieldForm";
import { Button } from "@/components/ui/button";

const globalFields = fields
  .filter((f) => f.classification === "GLOBAL" && f.parentFieldId === null)
  .sort((a, b) => a.sortOrder - b.sortOrder);

export function FormPage() {
  const navigate = useNavigate();
  const { answersMap, submit } = useAnswers();
  const [draft, setDraft] = React.useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setDraft((prev) => ({ ...answersMap, ...prev }));
  }, [answersMap]);

  const handleChange = (fieldId: string, value: unknown) => {
    setDraft((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await submit(
      globalFields
        .filter((f) => !f.default)
        .map((f) => ({ fieldId: f.id, value: draft[f.id] })),
    );
    setSubmitting(false);
    navigate("/my-benefits");
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 space-y-1">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Tell us about yourself</h1>
        <p className="text-sm text-muted-foreground">
          These answers help us match you with benefits you may be eligible for. Fields marked with a badge are
          already synced from your eGovPH account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <FieldForm fields={globalFields} values={draft} onChange={handleChange} />

        <div className="flex justify-end border-t border-border pt-6">
          <Button type="submit" size="lg" className="rounded-full px-8" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            See My Eligible Benefits
          </Button>
        </div>
      </form>
    </div>
  );
}
