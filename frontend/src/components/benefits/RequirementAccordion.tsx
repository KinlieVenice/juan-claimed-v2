import { FileText } from "lucide-react";
import type { FctBenefitRequirement } from "@/types/domain";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function RequirementAccordion({ requirements }: { requirements: FctBenefitRequirement[] }) {
  return (
    <Accordion type="multiple" className="overflow-hidden rounded-xl border border-border">
      {requirements.map((req, index) => (
        <AccordionItem key={req.id} value={req.id} className={index !== 0 ? "border-t border-border" : ""}>
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {index + 1}
              </span>
              <span className="font-medium text-foreground">{req.englishName}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4">
            <p className="pl-8 text-sm text-muted-foreground">{req.englishDescription}</p>
            {req.documents.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 pl-8">
                {req.documents.map((doc) => (
                  <span
                    key={doc}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground"
                  >
                    <FileText className="size-3.5 text-primary" />
                    {doc}
                  </span>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
