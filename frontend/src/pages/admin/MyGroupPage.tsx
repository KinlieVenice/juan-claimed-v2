import * as React from "react";
import { Building2, Contact } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getGroupById, getUsers, filterAgentMates, type UserGroup, type RealUser } from "@/services/users.service";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

// Agent-only page — the agent-side nav deliberately has no separate "Agent Mates" entry
// (see lib/nav.ts's AGENT_NAV); that table lives here, under the group summary it belongs
// to, instead of a second standalone page for what's really one "my group" concept.
export function MyGroupPage() {
  const { user, token } = useAuth();
  const [group, setGroup] = React.useState<UserGroup | null | undefined>(undefined);
  const [mates, setMates] = React.useState<RealUser[] | null>(null);

  React.useEffect(() => {
    if (!user?.groupId) {
      setGroup(null);
      return;
    }
    getGroupById(user.groupId).then(setGroup).catch(() => setGroup(null));
  }, [user?.groupId]);

  React.useEffect(() => {
    if (!user || !token) return;
    getUsers(token).then((users) => setMates(filterAgentMates(users, user.id)));
  }, [user, token]);

  const columns: DataTableColumn<RealUser>[] = [
    {
      key: "identity",
      header: "Name",
      width: "45%",
      cell: (u) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary/10 text-primary">
              {u.firstName[0]}
              {u.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {u.firstName} {u.lastName}
            </p>
            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "username", header: "Username", cell: (u) => <span className="text-sm text-muted-foreground">{u.username}</span> },
    {
      key: "status",
      header: "Status",
      width: "100px",
      cell: (u) => <Badge variant={u.active ? "success" : "secondary"}>{u.active ? "Active" : "Inactive"}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">My Group</h1>
        <p className="text-sm text-muted-foreground">The organization you're assigned to, and who else is in it.</p>
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

      <DataTable
        columns={columns}
        data={mates}
        rowKey={(u) => u.id}
        toolbar={false}
        pagination={false}
        empty={{ icon: Contact, title: "No Group Mates", description: "You're the only agent in your group right now." }}
      />
    </div>
  );
}
