import * as React from "react";
import { Loader2, Copy, Check, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAlert } from "@/lib/alert-store";
import { generatePassword } from "@/lib/password";
import { getScopes, type Scope } from "@/services/scopes.service";
import { getGroups, createUser, type UserGroup } from "@/services/users.service";
import { RoleAssignmentFields, type RoleAssignmentValue } from "@/components/admin/RoleAssignmentFields";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { ModalSection } from "@/components/ui/modal";
import { SidePanel } from "@/components/ui/side-panel";

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const FORM_ID = "create-user-form";
const EMPTY_IDENTITY = { username: "", email: "", firstName: "", middleName: "", lastName: "" };
// Superadmin only ever creates Agent accounts here — Users self-register via
// Google/eGov, and there's no self-serve path to another Superadmin.
const AGENT_ROLE: RoleAssignmentValue = { role: "AGENT", scopeId: null, groupId: null, psgcCode: null };

function PasswordGeneratorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <TextField
          label="Temporary password"
          value={value}
          onChange={onChange}
          disabled
          className="font-mono"
          containerClassName="flex-1"
        />
        <Button type="button" size="icon" variant="outline" onClick={copy} title="Copy password">
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
        <Button type="button" size="icon" variant="outline" onClick={() => onChange(generatePassword())} title="Generate a new password">
          <RefreshCw className="size-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Share this with the agent — it won't be shown again after creation.</p>
    </div>
  );
}

export function CreateUserModal({ open, onOpenChange, onCreated }: CreateUserModalProps) {
  const { token } = useAuth();
  const { showAlert, showApiError } = useAlert();
  const [scopes, setScopes] = React.useState<Scope[]>([]);
  const [groups, setGroups] = React.useState<UserGroup[]>([]);
  const [identity, setIdentity] = React.useState(EMPTY_IDENTITY);
  const [roleValue, setRoleValue] = React.useState<RoleAssignmentValue>(AGENT_ROLE);
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open || !token) return;
    getScopes(token).then(setScopes);
    getGroups().then(setGroups);
  }, [open, token]);

  React.useEffect(() => {
    if (!open) return;
    setIdentity(EMPTY_IDENTITY);
    setRoleValue(AGENT_ROLE);
    setPassword(generatePassword());
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    try {
      const saved = await createUser(
        {
          username: identity.username,
          email: identity.email,
          firstName: identity.firstName,
          middleName: identity.middleName || undefined,
          lastName: identity.lastName,
          role: "AGENT",
          scopeId: roleValue.scopeId,
          groupId: roleValue.groupId,
          psgcCode: roleValue.psgcCode,
          password,
        },
        token,
      );
      onCreated();
      onOpenChange(false);
      showAlert({ variant: "success", message: saved.message });
    } catch (err) {
      showApiError(err, "Could not create user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title="Add Agent"
      description="Agent accounts are created here. Users always sign in via Google or eGovPH — there's no admin-created path for them."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Create Agent
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-8">
        <ModalSection title="Basic Info">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <TextField
              label="First name"
              value={identity.firstName}
              onChange={(v) => setIdentity((d) => ({ ...d, firstName: v }))}
              required
            />
            <TextField
              label="Middle name (optional)"
              value={identity.middleName}
              onChange={(v) => setIdentity((d) => ({ ...d, middleName: v }))}
            />
            <TextField
              label="Last name"
              value={identity.lastName}
              onChange={(v) => setIdentity((d) => ({ ...d, lastName: v }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <TextField
              label="Username"
              value={identity.username}
              onChange={(v) => setIdentity((d) => ({ ...d, username: v }))}
              required
            />
            <TextField
              label="Email"
              type="email"
              value={identity.email}
              onChange={(v) => setIdentity((d) => ({ ...d, email: v }))}
              required
            />
          </div>
        </ModalSection>

        <ModalSection title="Scope & Jurisdiction">
          <RoleAssignmentFields value={roleValue} onChange={setRoleValue} scopes={scopes} groups={groups} lockRole />
        </ModalSection>

        <ModalSection title="Temporary Password">
          <PasswordGeneratorField value={password} onChange={setPassword} />
        </ModalSection>
      </form>
    </SidePanel>
  );
}
