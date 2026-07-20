import * as React from "react";
import { Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getGroupById, type UserGroup } from "@/services/users.service";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function MyGroupPage() {
  const { user } = useAuth();
  const [group, setGroup] = React.useState<UserGroup | null | undefined>(undefined);

  React.useEffect(() => {
    if (!user?.groupId) {
      setGroup(null);
      return;
    }
    getGroupById(user.groupId).then(setGroup).catch(() => setGroup(null));
  }, [user?.groupId]);

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
            <CardTitle className="text-base">{group.englishName}</CardTitle>
            <CardDescription>{group.englishDescription}</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">Role: {user?.role}</CardContent>
        </Card>
      )}
    </div>
  );
}
