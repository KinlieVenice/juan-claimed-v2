import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Gift, Sparkles, UserRound } from "lucide-react";
import { useAnswers } from "@/lib/answers-store";
import { getEligibilityResults, type EligibilityResult } from "@/services/benefits.service";
import { BenefitCard } from "@/components/benefits/BenefitCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";

export function EligibleBenefitsPage() {
  const navigate = useNavigate();
  const { answersMap, loading: answersLoading } = useAnswers();
  const [results, setResults] = React.useState<EligibilityResult[] | null>(null);

  React.useEffect(() => {
    if (answersLoading) return;
    getEligibilityResults(answersMap).then(setResults);
  }, [answersMap, answersLoading]);

  const matched = results?.filter((r) => r.status === "MATCHED") ?? [];
  const pending = results?.filter((r) => r.status === "PENDING") ?? [];
  const isLoading = results === null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">Your Eligible Benefits</h1>
          <p className="text-sm text-muted-foreground">
            Based on your current answers, here's what you may already qualify for.
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={() => navigate("/profile")}>
          <UserRound className="size-3.5" /> Profile
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/60" />
          ))}
        </div>
      ) : matched.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="No Eligible Benefits Yet"
          description="Complete the initial form so we can match you with benefits you may qualify for."
          action={pending.length === 0 ? { label: "Go to Form", onClick: () => navigate("/form") } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {matched.map((r) => (
            <BenefitCard key={r.benefit.id} benefit={r.benefit} />
          ))}
        </div>
      )}

      {!isLoading && pending.length > 0 && (
        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-primary/30 bg-primary/[0.03] px-6 py-10 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">You can be eligible for more benefits</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {pending.length === 1
                ? "There's 1 more benefit you may qualify for — answer a few more questions to find out."
                : `There are ${pending.length} more benefits you may qualify for — answer a few more questions to find out.`}
            </p>
          </div>
          <Button className="rounded-full px-6" onClick={() => navigate("/answer-more")}>
            Answer More
          </Button>
        </div>
      )}
    </div>
  );
}
