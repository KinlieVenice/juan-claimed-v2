import * as React from "react";
import { Users, Plus } from "lucide-react";
import { getUsers } from "@/services/users.service";
import { getGroupById } from "@/mock/users.mock";
import type { DimUser } from "@/types/domain";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function UsersPage() {
  const [users, setUsers] = React.useState<DimUser[] | null>(null);

  React.useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">Everyone with access to Juan-Claimed.</p>
        </div>
        <Button size="sm">
          <Plus /> Add User
        </Button>
      </div>

      {users === null ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted/60" />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No Users" description="Add your first user to get started." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-foreground">
                    {u.firstName} {u.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{u.role}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.groupId ? getGroupById(u.groupId)?.name : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={u.active ? "success" : "secondary"}>{u.active ? "Active" : "Inactive"}</Badge>
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
