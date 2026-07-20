import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ClipboardList, Lightbulb, MapPin, ShieldCheck } from "lucide-react";
import { getBenefitById } from "@/services/benefits.service";
import type { FctBenefit } from "@/types/domain";
import { formatBenefitScope } from "@/lib/benefit-scope";
import { RequirementAccordion } from "@/components/benefits/RequirementAccordion";
import { UtilizationAccordion } from "@/components/benefits/UtilizationAccordion";
import { Button } from "@/components/ui/button";

export function BenefitDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [benefit, setBenefit] = React.useState<FctBenefit | null | undefined>(undefined);

  React.useEffect(() => {
    if (!id) return;
    getBenefitById(id)
      .then(setBenefit)
      .catch(() => setBenefit(null));
  }, [id]);

  if (benefit === undefined) {
    return <div className="mx-auto max-w-3xl px-6 py-16 text-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (benefit === null) {
    return <div className="mx-auto max-w-3xl px-6 py-16 text-center text-sm text-muted-foreground">Benefit not found.</div>;
  }

  const stats = [
    { icon: MapPin, label: formatBenefitScope(benefit) },
    { icon: ShieldCheck, label: "eGovPH Verified" },
    { icon: ClipboardList, label: `${benefit.benefitRequirements.length} Requirement${benefit.benefitRequirements.length === 1 ? "" : "s"}` },
    { icon: Lightbulb, label: `${benefit.benefitUtilizations.length} Usage Tip${benefit.benefitUtilizations.length === 1 ? "" : "s"}` },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground" onClick={() => navigate(-1)}>
        <ArrowLeft className="size-3.5" /> Back
      </Button>

      <div className="mb-6 space-y-2">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">{benefit.name}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{benefit.englishDescription}</p>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-muted/30 px-3 py-4 text-center">
            <s.icon className="size-4 text-primary" />
            <span className="text-xs font-medium text-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      <section className="mb-10 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Requirements</h2>
          <p className="text-xs text-muted-foreground">What you'll need to apply.</p>
        </div>
        <RequirementAccordion requirements={benefit.benefitRequirements} />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Utilization</h2>
          <p className="text-xs text-muted-foreground">How to make the most of this benefit once granted.</p>
        </div>
        <UtilizationAccordion utilizations={benefit.benefitUtilizations} />
      </section>
    </div>
  );
}
