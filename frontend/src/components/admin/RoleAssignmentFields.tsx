import type { Scope } from "@/services/scopes.service";
import type { UserGroup, UserRole } from "@/services/users.service";
import { SelectField } from "@/components/ui/text-field";
import { PsgcPhLocationHierarchyField } from "@/components/fields/PsgcPhLocationHierarchyField";

// Maps a scope's own tier straight to how deep the PSGC picker should go — an agent must
// pick all the way down to their assigned tier (no stopping at a broader ancestor), and has
// no reason to go any deeper than it either.
const SCOPE_MAX_LEVEL: Record<string, "region" | "province" | "city" | "barangay"> = {
  REGIONS: "region",
  PROVINCES: "province",
  DISTRICTS: "province",
  "CITIES-MUNICIPALITIES": "city",
  BARANGAYS: "barangay",
};

export interface RoleAssignmentValue {
  role: UserRole;
  scopeId: string | null;
  groupId: string | null;
  psgcCode: string | null;
}

interface RoleAssignmentFieldsProps {
  value: RoleAssignmentValue;
  onChange: (value: RoleAssignmentValue) => void;
  scopes: Scope[];
  groups: UserGroup[];
  /** Hides the Role select — used by the Create flow (which only ever creates Agents) and
   * the Change Scope edit flow (Manage Agents only edits scope/jurisdiction, never role). */
  lockRole?: boolean;
}

const ROLE_OPTIONS = [
  { value: "SUPERADMIN", label: "Superadmin" },
  { value: "AGENT", label: "Agent" },
  { value: "USER", label: "User" },
];

// Mirrors backend/routes.md's exact role/scope/group/psgcCode matrix
// (validateRoleConfig, shared by POST /api/users and PATCH /api/users/:id/role):
//   SUPERADMIN            -> scope "SUPERADMIN", groupId required, psgcCode "SUPERADMIN"
//   AGENT + scope NATIONAL -> groupId required, psgcCode null
//   AGENT + local scope    -> groupId null, psgcCode required
//   USER                   -> scope/group/psgcCode all null
export function RoleAssignmentFields({ value, onChange, scopes, groups, lockRole }: RoleAssignmentFieldsProps) {
  const superadminScope = scopes.find((s) => s.value === "SUPERADMIN");
  const agentScopes = scopes.filter((s) => s.value !== "SUPERADMIN");
  const selectedScope = scopes.find((s) => s.id === value.scopeId);
  const isNationalAgent = value.role === "AGENT" && selectedScope?.value === "NATIONAL";
  const isLocalAgent = value.role === "AGENT" && !!selectedScope && selectedScope.value !== "NATIONAL";

  const setRole = (role: UserRole) => {
    if (role === "SUPERADMIN") {
      onChange({ role, scopeId: superadminScope?.id ?? null, groupId: null, psgcCode: "SUPERADMIN" });
    } else {
      onChange({ role, scopeId: null, groupId: null, psgcCode: null });
    }
  };

  const setAgentScope = (scopeId: string) => {
    const scope = scopes.find((s) => s.id === scopeId);
    onChange({
      role: "AGENT",
      scopeId,
      groupId: scope?.value === "NATIONAL" ? value.groupId : null,
      psgcCode: scope?.value === "NATIONAL" ? null : value.psgcCode,
    });
  };

  return (
    <div className="space-y-7">
      {!lockRole && (
        <SelectField
          label="Role"
          value={value.role}
          onChange={(v) => setRole(v as UserRole)}
          options={ROLE_OPTIONS}
        />
      )}

      {value.role === "AGENT" && (
        <SelectField
          label="Scope"
          value={value.scopeId ?? undefined}
          onChange={setAgentScope}
          options={agentScopes.map((s) => ({ value: s.id, label: s.name }))}
        />
      )}

      {(value.role === "SUPERADMIN" || isNationalAgent) && (
        <SelectField
          label="Group"
          value={value.groupId ?? undefined}
          onChange={(groupId) => onChange({ ...value, groupId })}
          options={groups.map((g) => ({ value: g.id, label: g.englishName, sublabel: g.tagalogName }))}
        />
      )}

      {isLocalAgent && (
        <PsgcPhLocationHierarchyField
          label="PSGC code"
          // Only the leaf PSGC code is persisted (see psgcCode below), so an already-assigned
          // agent's picker can't pre-fill its region/province/city columns from that code
          // alone (no reverse PSGC lookup) — reopening starts empty; re-picking overwrites it.
          value={null}
          onChange={(v) => onChange({ ...value, psgcCode: v?.leafCode ?? null })}
          allowAdminModeToggle
          // Stops the picker at the agent's own scope tier instead of always forcing a
          // drill-down to barangay — a CITIES-MUNICIPALITIES-scope agent must pick all the
          // way to their city (not stop earlier at region/province), and has no barangay
          // column to pick from at all, since their jurisdiction IS the whole city.
          maxLevel={SCOPE_MAX_LEVEL[selectedScope?.value ?? ""] ?? "barangay"}
          hint={`The specific ${selectedScope?.name.toLowerCase()} this agent is jurisdiction-restricted to.`}
        />
      )}
    </div>
  );
}
