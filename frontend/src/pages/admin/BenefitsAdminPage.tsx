import * as React from "react";
import { Gift, Plus, Pencil, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getBenefits } from "@/services/benefits.service";
import { formatBenefitScope } from "@/lib/benefit-scope";
import type { FctBenefit } from "@/types/domain";
import { BenefitFormModal } from "@/components/benefits/BenefitFormModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

export function BenefitsAdminPage() {
  const { token, role } = useAuth();
  const canManage = role === "SUPERADMIN" || role === "AGENT";

  const [benefits, setBenefits] = React.useState<FctBenefit[] | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<FctBenefit | null>(null);
  const [viewOnly, setViewOnly] = React.useState(false);

  const load = React.useCallback(() => {
    if (!token) return;
    getBenefits(token).then(setBenefits);
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setViewOnly(false);
    setModalOpen(true);
  };

  const openEdit = (benefit: FctBenefit) => {
    setEditing(benefit);
    setViewOnly(false);
    setModalOpen(true);
  };

  const openView = (benefit: FctBenefit) => {
    setEditing(benefit);
    setViewOnly(true);
    setModalOpen(true);
  };

  const columns: DataTableColumn<FctBenefit>[] = [
    {
      key: "name",
      header: "Name",
      cell: (b) => <span className="font-medium text-foreground">{b.name}</span>,
    },
    {
      key: "scope",
      header: "Scope",
      cell: (b) => <Badge variant={b.isNationwide ? "success" : "outline"}>{formatBenefitScope(b)}</Badge>,
    },
    {
      key: "requirements",
      header: "Requirements",
      cell: (b) => <span className="text-muted-foreground">{b.benefitRequirements.length}</span>,
    },
    {
      key: "utilizations",
      header: "Utilization Tips",
      cell: (b) => <span className="text-muted-foreground">{b.benefitUtilizations.length}</span>,
    },
    {
      key: "howToApply",
      header: "How to Apply",
      cell: (b) => <span className="text-muted-foreground">{b.benefitHowToApplies.length}</span>,
    },
    {
      key: "actions",
      header: "",
      width: "80px",
      cellClassName: "text-right",
      cell: (b) => (
        <div className="flex justify-end gap-1">
          {canManage && (
            <Button size="icon" variant="ghost" className="size-8" onClick={() => openEdit(b)} title="Edit">
              <Pencil className="size-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="size-8" onClick={() => openView(b)} title="View">
            <Eye className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Benefits</h1>
          <p className="text-sm text-muted-foreground">Programs applicants can qualify for, with their eligibility rules.</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={openCreate}>
            <Plus /> Add Benefit
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={benefits}
        rowKey={(b) => b.id}
        searchText={(b) => b.name}
        searchPlaceholder="Search benefits…"
        empty={{
          icon: Gift,
          title: "No Benefits",
          description: "Create your first benefit to get started.",
          ...(canManage ? { action: { label: "Add Benefit", onClick: openCreate } } : {}),
        }}
      />

      <BenefitFormModal open={modalOpen} onOpenChange={setModalOpen} benefit={editing} viewOnly={viewOnly} onSaved={load} />
    </div>
  );
}
