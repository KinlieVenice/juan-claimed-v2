import * as React from "react";
import { Contact, Plus, MoreHorizontal, ShieldOff, ShieldCheck, KeyRound, UserCog, Copy, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAlert } from "@/lib/alert-store";
import { getUsers, setUserActive, resetUserPassword, type RealUser } from "@/services/users.service";
import { CreateUserModal } from "@/components/admin/CreateUserModal";
import { AssignRoleModal } from "@/components/admin/AssignRoleModal";
import { UserIdentityCell, StatusDot, RoleBadge } from "@/components/admin/UserIdentityCell";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { SidePanel } from "@/components/ui/side-panel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AgentsStaffPage() {
  const { token } = useAuth();
  const { showAlert, showApiError } = useAlert();
  const [users, setUsers] = React.useState<RealUser[] | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [roleTarget, setRoleTarget] = React.useState<RealUser | null>(null);
  const [resetTarget, setResetTarget] = React.useState<RealUser | null>(null);
  const [resetPassword, setResetPassword] = React.useState<string | null>(null);
  const [resetting, setResetting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [deactivateTarget, setDeactivateTarget] = React.useState<RealUser | null>(null);
  const [deactivating, setDeactivating] = React.useState(false);

  const load = React.useCallback(() => {
    if (!token) return;
    getUsers(token).then((all) => setUsers(all.filter((u) => u.role === "AGENT" || u.role === "SUPERADMIN")));
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  const setActive = async (user: RealUser, active: boolean) => {
    if (!token) return;
    try {
      const saved = await setUserActive(user.id, active, token);
      load();
      showAlert({ variant: "success", message: saved.message });
    } catch (err) {
      showApiError(err, "Could not update this account's status.");
    }
  };

  const confirmDeactivate = async () => {
    if (!token || !deactivateTarget) return;
    setDeactivating(true);
    try {
      const saved = await setUserActive(deactivateTarget.id, false, token);
      load();
      setDeactivateTarget(null);
      showAlert({ variant: "success", message: saved.message });
    } catch (err) {
      showApiError(err, "Could not deactivate this account.");
    } finally {
      setDeactivating(false);
    }
  };

  const openReset = (user: RealUser) => {
    setResetTarget(user);
    setResetPassword(null);
    setCopied(false);
  };

  const confirmReset = async () => {
    if (!token || !resetTarget) return;
    setResetting(true);
    try {
      const result = await resetUserPassword(resetTarget.id, token);
      setResetPassword(result.data.temporaryPassword);
      load();
    } catch (err) {
      showApiError(err, "Could not reset password.");
    } finally {
      setResetting(false);
    }
  };

  const copyResetPassword = async () => {
    if (!resetPassword) return;
    await navigator.clipboard.writeText(resetPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const columns: DataTableColumn<RealUser>[] = [
    {
      key: "identity",
      header: "Name",
      width: "36%",
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
    {
      key: "actions",
      header: "",
      width: "56px",
      cellClassName: "text-right",
      // Superadmin accounts aren't manageable from here — no self/only-admin lockout risk.
      cell: (u) =>
        u.role === "SUPERADMIN" ? null : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setRoleTarget(u)}>
                <UserCog /> Change Scope
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openReset(u)}>
                <KeyRound /> Reset Password
              </DropdownMenuItem>
              {u.active ? (
                <DropdownMenuItem onClick={() => setDeactivateTarget(u)} variant="destructive">
                  <ShieldOff /> Deactivate
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setActive(u, true)}>
                  <ShieldCheck /> Activate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Manage Agents</h1>
          <p className="text-sm text-muted-foreground">Admin-managed accounts — Superadmin and Agent.</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus /> Add Agent
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        rowKey={(u) => u.id}
        searchText={(u) => `${u.firstName} ${u.lastName} ${u.email} ${u.username} ${u.role} ${u.group?.englishName ?? ""}`}
        searchPlaceholder="Search agents…"
        empty={{
          icon: Contact,
          title: "No Agents Yet",
          description: "Add your first agent to get started.",
          action: { label: "Add Agent", onClick: () => setCreateOpen(true) },
        }}
      />

      <CreateUserModal open={createOpen} onOpenChange={setCreateOpen} onCreated={load} />
      <AssignRoleModal user={roleTarget} onOpenChange={(open) => !open && setRoleTarget(null)} onAssigned={load} />

      <SidePanel
        open={!!resetTarget}
        onOpenChange={(open) => !open && setResetTarget(null)}
        size="xs"
        title="Reset Password"
        description={
          resetPassword
            ? "Share this temporary password with them — it won't be shown again."
            : `Generate a new temporary password for ${resetTarget?.firstName} ${resetTarget?.lastName}? They'll be required to set a new one on their next login.`
        }
        footer={
          resetPassword ? (
            <Button className="w-full rounded-full" onClick={() => setResetTarget(null)}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setResetTarget(null)}>
                Cancel
              </Button>
              <Button onClick={confirmReset} disabled={resetting}>
                {resetting ? "Resetting…" : "Reset Password"}
              </Button>
            </>
          )
        }
      >
        {resetPassword && (
          <div className="flex items-center gap-2">
            <TextField label="Temporary password" value={resetPassword} onChange={() => {}} disabled className="font-mono" containerClassName="flex-1" />
            <Button type="button" size="icon" variant="outline" onClick={copyResetPassword}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
        )}
      </SidePanel>

      <SidePanel
        open={!!deactivateTarget}
        onOpenChange={(open) => !open && setDeactivateTarget(null)}
        size="xs"
        title="Deactivate Account"
        description={`${deactivateTarget?.firstName} ${deactivateTarget?.lastName} won't be able to sign in until reactivated. This can be undone anytime.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeactivateTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeactivate} disabled={deactivating}>
              {deactivating ? "Deactivating…" : "Deactivate"}
            </Button>
          </>
        }
      />
    </div>
  );
}
