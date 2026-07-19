import type { UserRole } from "../generated/prisma/client.js";

/**
 * Strict role/scope/group/psgcCode matrix, shared by createUser and
 * assignUserRole so the two never drift:
 * - SUPERADMIN: scope must be SUPERADMIN, groupId required, psgcCode must be
 *   the literal sentinel "SUPERADMIN".
 * - AGENT + NATIONAL scope: groupId required, psgcCode must be null.
 * - AGENT + any local scope: groupId must be null, psgcCode required.
 * - USER: scopeId/groupId/psgcCode must all be null.
 */
export const validateRoleConfig = (
  role: UserRole,
  scope: { value: string } | null,
  groupId: string | null,
  scopeId: string | null,
  psgcCode: string | null,
): void => {
  if (role === "SUPERADMIN") {
    if (scope?.value !== "SUPERADMIN" || !groupId || psgcCode !== "SUPERADMIN") {
      throw new Error("INVALID_SUPERADMIN_CONFIG");
    }
  } else if (role === "AGENT") {
    if (!scope) throw new Error("AGENT_REQUIRES_SCOPE");

    if (scope.value === "NATIONAL") {
      if (!groupId || psgcCode !== null) {
        throw new Error("INVALID_NATIONAL_AGENT_CONFIG");
      }
    } else {
      if (groupId !== null || !psgcCode) {
        throw new Error("INVALID_LOCAL_AGENT_CONFIG");
      }
    }
  } else if (role === "USER") {
    if (scopeId !== null || groupId !== null || psgcCode !== null) {
      throw new Error("INVALID_USER_CONFIG");
    }
  }
};
