import * as React from "react";
import { ListChecks, Plus, Lock } from "lucide-react";
import { getFields } from "@/services/fields.service";
import type { DimField } from "@/types/domain";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function FieldsAdminPage() {
  const [fields, setFields] = React.useState<DimField[] | null>(null);

  React.useEffect(() => {
    getFields().then(setFields);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Fields</h1>
          <p className="text-sm text-muted-foreground">Questions applicants answer to determine eligibility.</p>
        </div>
        <Button size="sm">
          <Plus /> Add Field
        </Button>
      </div>

      {fields === null ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted/60" />
      ) : fields.length === 0 ? (
        <EmptyState icon={ListChecks} title="No Fields" description="Add your first field to get started." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Required</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields
                .filter((f) => f.parentFieldId === null)
                .map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium text-foreground">{f.englishName}</TableCell>
                    <TableCell className="text-muted-foreground">{f.fieldInputType.englishName}</TableCell>
                    <TableCell>
                      <Badge variant={f.classification === "GLOBAL" ? "outline" : "secondary"}>{f.classification}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{f.required ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {f.default && (
                        <Badge variant="secondary" className="gap-1 text-[10px]">
                          <Lock className="size-2.5" /> eGovPH
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
