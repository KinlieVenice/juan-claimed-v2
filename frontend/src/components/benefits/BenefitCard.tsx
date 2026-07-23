import { useNavigate } from "react-router-dom";
import { MapPin, Sparkles } from "lucide-react";
import type { FctBenefit } from "@/types/domain";
import type { EligibilityStatus } from "@/services/eligibility.service";
import { formatBenefitScope } from "@/lib/benefit-scope";
import { ClayCard } from "@/components/apply/ClayCard";

const CATEGORY_EMOJI = ["🎓", "💊", "👶", "🏠", "💼", "🚌", "🌾", "⚖️"];

function emojiFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return CATEGORY_EMOJI[hash % CATEGORY_EMOJI.length];
}

// The co-dev's clay card pattern (dev-feat-initial-KIN, commit 8baced3's benefits.tsx) —
// now driven by the real benefit + real per-benefit eligibility status instead of
// hardcoded sample data.
export function BenefitCard({ benefit, status, pendingCount }: { benefit: FctBenefit; status: EligibilityStatus; pendingCount: number }) {
  const navigate = useNavigate();

  return (
    <ClayCard variant="plain" className="flex h-full flex-col p-6" onClick={() => navigate(`/benefits/${benefit.id}`)}>
      <div className="flex items-start justify-between gap-3">
        <div className="clay-yellow grid h-12 w-12 shrink-0 place-items-center text-2xl">{emojiFor(benefit.id)}</div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase ${
            benefit.isNationwide ? "bg-[color:var(--color-ph-blue)] text-white" : "bg-[color:var(--color-ph-yellow)] text-slate-900"
          }`}
        >
          <MapPin className="mr-1 inline size-2.5" />
          {formatBenefitScope(benefit)}
        </span>
      </div>

      <h3 className="mt-3 font-display text-xl font-bold text-slate-900">{benefit.name}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{benefit.englishDescription}</p>

      <div className="mt-auto flex items-center justify-between pt-4">
        {status === "MATCHED" ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--color-success,#16803c)]">
            <Sparkles className="size-3.5" /> You qualify
          </span>
        ) : (
          <span className="text-xs font-medium text-slate-500">
            {pendingCount === 1 ? "1 more answer needed" : `${pendingCount} more answers needed`}
          </span>
        )}
        <span className="text-sm font-semibold text-[color:var(--color-ph-blue)]">View details →</span>
      </div>
    </ClayCard>
  );
}

// Mirrors BenefitCard's real structure/spacing line-for-line (icon+badge row, title,
// 2-line description, footer row) instead of a plain blank pulsing box — so the loading
// state doesn't visibly jump/reflow into a differently-shaped layout once real cards land.
export function BenefitCardSkeleton() {
  return (
    <ClayCard variant="plain" className="flex h-full flex-col p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-slate-200" />
        <div className="h-5 w-20 shrink-0 animate-pulse rounded-full bg-slate-200" />
      </div>

      <div className="mt-3 h-6 w-3/4 animate-pulse rounded-md bg-slate-200" />
      <div className="mt-2 space-y-1.5">
        <div className="h-4 w-full animate-pulse rounded-md bg-slate-200" />
        <div className="h-4 w-2/3 animate-pulse rounded-md bg-slate-200" />
      </div>

      <div className="mt-auto flex items-center justify-between pt-4">
        <div className="h-4 w-28 animate-pulse rounded-md bg-slate-200" />
        <div className="h-4 w-20 animate-pulse rounded-md bg-slate-200" />
      </div>
    </ClayCard>
  );
}
