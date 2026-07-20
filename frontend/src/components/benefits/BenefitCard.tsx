import { useNavigate } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import type { FctBenefit } from "@/types/domain";
import { formatBenefitScope } from "@/lib/benefit-scope";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function BenefitCard({ benefit }: { benefit: FctBenefit }) {
  const navigate = useNavigate();

  return (
    <Card className="gap-4 py-5 transition-shadow hover:shadow-md">
      <CardHeader className="gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base">{benefit.name}</CardTitle>
          <Badge variant={benefit.isNationwide ? "success" : "outline"} className="shrink-0">
            <MapPin className="size-2.5" />
            {formatBenefitScope(benefit)}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{benefit.englishDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button size="sm" variant="secondary" className="rounded-full" onClick={() => navigate(`/benefits/${benefit.id}`)}>
          View Details <ArrowRight className="size-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}
