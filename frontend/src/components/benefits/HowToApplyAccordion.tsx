import { FileText, ListChecks } from "lucide-react";
import type { FctBenefitHowToApply } from "@/types/domain";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Same shape/pattern as RequirementAccordion/UtilizationAccordion — one numbered step per
// entry (application steps read naturally as an ordered sequence, unlike requirements/
// utilization tips which don't have an inherent order), with the same optional attachment
// chip row a step's own instructions might need (e.g. a sample form to download).
export function HowToApplyAccordion({ steps }: { steps: FctBenefitHowToApply[] }) {
  return (
    <Accordion type="multiple" className="overflow-hidden rounded-xl border border-border">
      {steps.map((step, index) => (
        <AccordionItem key={step.id} value={step.id} className={index !== 0 ? "border-t border-border" : ""}>
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-[11px] font-semibold text-success">
                {index + 1}
              </span>
              <span className="font-medium text-foreground">{step.englishName}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4">
            <p className="pl-8 text-sm text-muted-foreground">{step.englishDescription}</p>
            {step.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 pl-8">
                {step.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.filePath}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <FileText className="size-3.5 text-primary" />
                    {attachment.fileLabel}
                  </a>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
      {steps.length === 0 && (
        <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <ListChecks className="size-4" /> No application steps listed for this benefit.
        </div>
      )}
    </Accordion>
  );
}
