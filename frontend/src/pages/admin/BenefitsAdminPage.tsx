import * as React from "react";
import { Gift, Pencil, Plus } from "lucide-react";
import { getBenefits } from "@/services/benefits.service";
import type { FctBenefit } from "@/types/domain";
import { BenefitFormModal } from "@/components/benefits/BenefitFormModal";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function BenefitsAdminPage() {
  const [benefits, setBenefits] = React.useState<FctBenefit[] | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<FctBenefit | undefined>(undefined);

  const load = React.useCallback(() => {
    getBenefits().then(setBenefits);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const openEdit = (benefit: FctBenefit) => {
    setEditing(benefit);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Benefit</h1>
          <p className="text-sm text-muted-foreground">Programs applicants can qualify for, with their eligibility rules.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus /> Add Benefit
        </Button>
      </div>

      {benefits === null ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted/60" />
      ) : benefits.length === 0 ? (
        <EmptyState icon={Gift} title="No Benefits" description="Create your first benefit to get started." action={{ label: "Add Benefit", onClick: openCreate }} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Requirements</TableHead>
                <TableHead>Utilization Tips</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {benefits.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium text-foreground">{b.name}</TableCell>
                  <TableCell>
                    <Badge variant={b.isNationwide ? "success" : "outline"}>{b.isNationwide ? "Nationwide" : b.scopeName}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{b.benefitRequirements.length}</TableCell>
                  <TableCell className="text-muted-foreground">{b.benefitUtilizations.length}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(b)}>
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <BenefitFormModal open={modalOpen} onOpenChange={setModalOpen} benefit={editing} onSaved={load} />
    </div>
  );
}
