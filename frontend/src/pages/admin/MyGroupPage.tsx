import * as React from "react";
import { Building2 } from "lucide-react";
import { useAuth } from "@/lib/mock-auth";
import { getGroupById } from "@/services/users.service";
import type { DimGroup } from "@/types/domain";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { users } from "@/mock/users.mock";

export function MyGroupPage() {
  const { user } = useAuth();
  const [group, setGroup] = React.useState<DimGroup | null | undefined>(undefined);
  const currentUser = users.find((u) => u.id === user?.id);

  React.useEffect(() => {
    if (!currentUser?.groupId) {
      setGroup(null);
      return;
    }
    getGroupById(currentUser.groupId).then((g) => setGroup(g ?? null));
  }, [currentUser?.groupId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">My Group</h1>
        <p className="text-sm text-muted-foreground">The organization you're assigned to.</p>
      </div>

      {group === undefined ? (
        <div className="h-32 animate-pulse rounded-xl bg-muted/60" />
      ) : group === null ? (
        <EmptyState icon={Building2} title="No Group Assigned" description="Ask a Superadmin to assign you to a group." />
      ) : (
        <Card className="max-w-md gap-2 py-5">
          <CardHeader>
            <CardTitle className="text-base">{group.name}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Scope: {currentUser?.role}</CardContent>
        </Card>
      )}
    </div>
  );
}
