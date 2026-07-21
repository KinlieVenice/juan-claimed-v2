import { Check, X, HelpCircle } from "lucide-react";
import type { EligibilityStatus } from "@/services/eligibility.service";

const ROW_STYLE: Record<EligibilityStatus, string> = {
  MATCHED: "clay-green",
  NOT_ELIGIBLE: "clay-red",
  PENDING: "clay-yellow",
};

const ICON = {
  MATCHED: Check,
  NOT_ELIGIBLE: X,
  PENDING: HelpCircle,
} as const;

const LABEL: Record<EligibilityStatus, string> = {
  MATCHED: "Met",
  NOT_ELIGIBLE: "Not met",
  PENDING: "Needs an answer",
};

// The per-condition tick list — "req1 ✓, req2 ✗, req3-5 still pending" — driven by the
// backend's real leaf-by-leaf evaluation (benefitEligibility.service.ts), not a client guess.
export function ConditionChecklist({ leaves }: { leaves: { fieldId: string; fieldLabel: string; status: EligibilityStatus }[] }) {
  if (leaves.length === 0) {
    return <p className="text-sm text-slate-600">This benefit has no configured requirements to check — everyone qualifies.</p>;
  }

  return (
    <div className="space-y-2">
      {leaves.map((leaf) => {
        const Icon = ICON[leaf.status];
        return (
          <div key={leaf.fieldId} className={`${ROW_STYLE[leaf.status]} flex items-center gap-3 px-4 py-3`}>
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/70">
              <Icon className="size-4 text-slate-700" />
            </span>
            <span className="flex-1 text-sm font-medium text-slate-800">{leaf.fieldLabel}</span>
            <span className="text-xs font-semibold tracking-wide text-slate-600 uppercase">{LABEL[leaf.status]}</span>
          </div>
        );
      })}
    </div>
  );
}
