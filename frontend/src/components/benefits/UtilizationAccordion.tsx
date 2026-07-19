import { Lightbulb } from "lucide-react";
import type { FctBenefitUtilization } from "@/types/domain";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function UtilizationAccordion({ utilizations }: { utilizations: FctBenefitUtilization[] }) {
  return (
    <Accordion type="multiple" className="overflow-hidden rounded-xl border border-border">
      {utilizations.map((util, index) => (
        <AccordionItem key={util.id} value={util.id} className={index !== 0 ? "border-t border-border" : ""}>
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-warning/20 text-warning-foreground">
                <Lightbulb className="size-3" />
              </span>
              <span className="font-medium text-foreground">{util.englishName}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4">
            <p className="pl-8 text-sm text-muted-foreground">{util.englishDescription}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
