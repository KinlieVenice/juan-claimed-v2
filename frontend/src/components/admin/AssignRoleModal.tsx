import * as React from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAlert } from "@/lib/alert-store";
import { getScopes, type Scope } from "@/services/scopes.service";
import { getGroups, assignUserRole, type UserGroup, type RealUser } from "@/services/users.service";
import { RoleAssignmentFields, type RoleAssignmentValue } from "@/components/admin/RoleAssignmentFields";
import { Button } from "@/components/ui/button";
import { ModalSection } from "@/components/ui/modal";
import { SidePanel } from "@/components/ui/side-panel";

interface AssignRoleModalProps {
  user: RealUser | null;
  onOpenChange: (open: boolean) => void;
  onAssigned: () => void;
}

const FORM_ID = "assign-role-form";

export function AssignRoleModal({ user, onOpenChange, onAssigned }: AssignRoleModalProps) {
  const { token } = useAuth();
  const { showAlert, showApiError } = useAlert();
  const [scopes, setScopes] = React.useState<Scope[]>([]);
  const [groups, setGroups] = React.useState<UserGroup[]>([]);
  const [roleValue, setRoleValue] = React.useState<RoleAssignmentValue>({ role: "USER", scopeId: null, groupId: null, psgcCode: null });
  const [submitting, setSubmitting] = React.useState(false);

  const open = !!user;

  React.useEffect(() => {
    if (!open || !token) return;
    getScopes(token).then(setScopes);
    getGroups().then(setGroups);
  }, [open, token]);

  React.useEffect(() => {
    if (!user) return;
    setRoleValue({ role: user.role, scopeId: user.scopeId, groupId: user.groupId, psgcCode: user.psgcCode });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;

    setSubmitting(true);
    try {
      const saved = await assignUserRole(user.id, roleValue, token);
      onAssigned();
      onOpenChange(false);
      showAlert({ variant: "success", message: saved.message });
    } catch (err) {
      showApiError(err, "Could not update this agent.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      size="xs"
      title="Change Scope"
      description={user ? `Update ${user.firstName} ${user.lastName}'s scope and jurisdiction. Role can't be changed here.` : ""}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Save Changes
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6">
        <ModalSection>
          <RoleAssignmentFields value={roleValue} onChange={setRoleValue} scopes={scopes} groups={groups} lockRole />
        </ModalSection>
      </form>
    </SidePanel>
  );
}
