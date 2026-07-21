import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Gift, Sparkles, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAnswers } from "@/lib/answers-store";
import { getEligibilityResults, type EligibilityResult } from "@/services/benefits.service";
import { BenefitCard } from "@/components/benefits/BenefitCard";
import { ApplyChrome, ApplyFooter } from "@/components/apply/ApplyChrome";
import { ClayCard } from "@/components/apply/ClayCard";

// The candidate-benefits list — real per-benefit status now (benefitEligibility.service.ts
// on the backend), so MATCHED means every requirement (including residency) already
// checks out, and PENDING means some are still unanswered but nothing has disqualified the
// applicant outright — a benefit only ever drops off this "still possible" set entirely
// once it's NOT_ELIGIBLE, never shown as something to "answer more" for.
export function EligibleBenefitsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { isGuest, answersMap, repeaterRowsMap } = useAnswers();
  const [results, setResults] = React.useState<EligibilityResult[] | null>(null);

  React.useEffect(() => {
    // Guests have no stored userId — their in-browser answers travel inline instead (see
    // benefits.service.ts's getEligibilityResults / lib/answers-store.tsx's guest branch).
    getEligibilityResults(token ?? undefined, isGuest ? { answers: answersMap, repeaterRows: repeaterRowsMap } : undefined).then(setResults);
    // answersMap/repeaterRowsMap intentionally excluded from deps for the signed-in path
    // (server-evaluated, doesn't need a client re-check on every local state change); for
    // guests this still re-runs whenever isGuest/token settle, which is when it first loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, isGuest]);

  const matched = results?.filter((r) => r.status === "MATCHED") ?? [];
  const pending = results?.filter((r) => r.status === "PENDING") ?? [];
  const isLoading = results === null;

  return (
    <div className="apply-bg min-h-screen overflow-x-hidden text-slate-800">
      <ApplyChrome />

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-5 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <span className="clay-yellow inline-block px-3 py-1 text-[10px] font-bold tracking-[0.18em] uppercase md:text-[11px]" style={{ color: "#8a6a00" }}>
              Your Benefits
            </span>
            <h1 className="mt-4 font-display text-3xl leading-[1.05] font-black tracking-tight text-slate-900 md:text-4xl lg:text-5xl">
              {isLoading ? "Finding your benefits" : `${matched.length} benefit${matched.length === 1 ? "" : "s"}`}{" "}
              <span className="text-[color:var(--color-ph-blue)]">found for you</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600 md:text-base">
              Based on your current answers, here's what you may already qualify for.
            </p>
            {isGuest && !isLoading && (
              <button
                type="button"
                onClick={() => navigate("/answered")}
                className="clay mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:-translate-y-0.5"
              >
                <FileText className="size-3.5" /> See the answered form
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="clay h-40 animate-pulse" />
              ))}
            </div>
          ) : matched.length === 0 ? (
            <ClayCard variant="blue" className="flex flex-col items-center gap-4 p-10 text-center">
              <div className="clay-yellow grid h-14 w-14 place-items-center text-2xl">
                <Gift className="size-6 text-[color:var(--color-ph-blue)]" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900">No eligible benefits yet</h3>
                <p className="mt-1 max-w-md text-sm text-slate-600">
                  Complete the initial questionnaire so we can match you with benefits you may qualify for.
                </p>
              </div>
              {pending.length === 0 && (
                <button
                  type="button"
                  onClick={() => navigate("/form")}
                  className="clay-blue px-6 py-3 text-sm font-bold text-[color:var(--color-ph-blue)] transition hover:-translate-y-1"
                >
                  Go to the quiz
                </button>
              )}
            </ClayCard>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {matched.map((r) => (
                <BenefitCard key={r.benefit.id} benefit={r.benefit} status={r.status} pendingCount={r.pendingFieldIds.length} />
              ))}
            </div>
          )}

          {!isLoading && pending.length > 0 && (
            <ClayCard variant="yellow" className="mt-12 flex flex-col items-center gap-4 p-10 text-center">
              <div className="clay grid h-11 w-11 place-items-center">
                <Sparkles className="size-5 text-[color:var(--color-ph-blue)]" />
              </div>
              <div>
                <p className="font-display text-lg font-bold text-slate-900">You could be eligible for more</p>
                <p className="mt-1 max-w-md text-sm text-slate-700">
                  {pending.length === 1
                    ? "There's 1 more benefit you may qualify for — answer a few more questions to find out."
                    : `There are ${pending.length} more benefits you may qualify for — answer a few more questions to find out.`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/answer-more")}
                className="clay-blue group inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-[color:var(--color-ph-blue)] transition hover:-translate-y-1"
              >
                Answer more
                <span className="transition group-hover:translate-x-1">→</span>
              </button>
            </ClayCard>
          )}
        </div>
      </section>

      <ApplyFooter />
    </div>
  );
}
