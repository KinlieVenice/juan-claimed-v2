import * as React from "react";
import { Building2, Plus } from "lucide-react";
import { getGroups } from "@/services/users.service";
import type { DimGroup } from "@/types/domain";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function GroupsPage() {
  const [groups, setGroups] = React.useState<DimGroup[] | null>(null);

  React.useEffect(() => {
    getGroups().then(setGroups);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Groups</h1>
          <p className="text-sm text-muted-foreground">National agencies and organizations that create benefits.</p>
        </div>
        <Button size="sm">
          <Plus /> Add Group
        </Button>
      </div>

      {groups === null ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted/60" />
      ) : groups.length === 0 ? (
        <EmptyState icon={Building2} title="No Groups" description="Add your first group to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <Card key={g.id} className="gap-2 py-5">
              <CardHeader>
                <CardTitle className="text-base">{g.name}</CardTitle>
                <CardDescription>{g.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
