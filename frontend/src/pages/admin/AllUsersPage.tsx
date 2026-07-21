import * as React from "react";
import { Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getUsers, type RealUser } from "@/services/users.service";
import { UserIdentityCell, StatusDot, RoleBadge } from "@/components/admin/UserIdentityCell";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

const COLUMNS: DataTableColumn<RealUser>[] = [
  {
    key: "identity",
    header: "Name",
    width: "40%",
    cell: (u) => <UserIdentityCell firstName={u.firstName} lastName={u.lastName} email={u.email} avatarUrl={u.avatarUrl} />,
  },
  {
    key: "role",
    header: "Role",
    cell: (u) => <RoleBadge role={u.role} />,
  },
  {
    key: "group",
    header: "Group",
    cell: (u) => <span className="text-muted-foreground">{u.group?.englishName ?? "—"}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (u) => <StatusDot active={u.active} />,
  },
];

// Read-only — every account regardless of role (Superadmin/Agent/User). Managing staff
// accounts (create, reset password, deactivate) lives on the Manage Agents page instead;
// Users here self-registered via Google/eGov and aren't admin-managed.
export function AllUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = React.useState<RealUser[] | null>(null);

  React.useEffect(() => {
    if (!token) return;
    getUsers(token).then(setUsers);
  }, [token]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">All Users</h1>
        <p className="text-sm text-muted-foreground">Everyone with a Juan Claimed account, any role.</p>
      </div>

      <DataTable
        columns={COLUMNS}
        data={users}
        rowKey={(u) => u.id}
        searchText={(u) => `${u.firstName} ${u.lastName} ${u.email} ${u.username} ${u.role}`}
        searchPlaceholder="Search users…"
        empty={{ icon: Users, title: "No Users", description: "No accounts exist yet." }}
      />
    </div>
  );
}
