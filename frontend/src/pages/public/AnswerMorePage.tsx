import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";
import { getFieldById } from "@/mock/fields.mock";
import { useAnswers } from "@/lib/answers-store";
import { getEligibilityResults } from "@/services/benefits.service";
import { getUnansweredFieldIds } from "@/lib/eligibility";
import type { DimField } from "@/types/domain";
import { FieldForm } from "@/components/fields/FieldForm";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AnswerMorePage() {
  const navigate = useNavigate();
  const { answersMap, submit, loading: answersLoading } = useAnswers();
  const [pendingFields, setPendingFields] = React.useState<DimField[] | null>(null);
  const [pendingBenefitNames, setPendingBenefitNames] = React.useState<string[]>([]);
  const [draft, setDraft] = React.useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (answersLoading) return;
    getEligibilityResults(answersMap).then((results) => {
      const pending = results.filter((r) => r.status === "PENDING");
      const fieldIds = new Set(pending.flatMap((r) => getUnansweredFieldIds(r.benefit.eligibilityTree, answersMap)));
      setPendingFields(
        Array.from(fieldIds)
          .map((id) => getFieldById(id))
          .filter((f): f is DimField => !!f),
      );
      setPendingBenefitNames(pending.map((r) => r.benefit.name));
      setDraft((prev) => ({ ...answersMap, ...prev }));
    });
  }, [answersMap, answersLoading]);

  const handleChange = (fieldId: string, value: unknown) => setDraft((prev) => ({ ...prev, [fieldId]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFields) return;
    setSubmitting(true);
    await submit(pendingFields.map((f) => ({ fieldId: f.id, value: draft[f.id] })));
    setSubmitting(false);
    navigate("/my-benefits");
  };

  if (pendingFields === null) {
    return <div className="mx-auto max-w-3xl px-6 py-16 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (pendingFields.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <EmptyState
          icon={Sparkles}
          title="Nothing More to Answer Right Now"
          description="You're all caught up — check back on My Benefits to see what you currently qualify for."
          action={{ label: "Back to My Benefits", onClick: () => navigate("/my-benefits") }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Answer a Few More Questions</h1>
        <p className="text-sm text-muted-foreground">
          These extra answers could unlock more benefits for you.
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {pendingBenefitNames.map((name) => (
            <Badge key={name} variant="secondary">
              {name}
            </Badge>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <FieldForm fields={pendingFields} values={draft} onChange={handleChange} />

        <div className="flex justify-end border-t border-border pt-6">
          <Button type="submit" size="lg" className="rounded-full px-8" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Check My Eligibility
          </Button>
        </div>
      </form>
    </div>
  );
}
