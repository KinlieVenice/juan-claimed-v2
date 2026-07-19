import { prisma } from "../utils/prisma.js";
import { UserRole } from "../generated/prisma/client.js";
import type { AssignRoleDto } from "../requests/user.request.js";

export const fetchAllUsers = async () => {
  return await prisma.dimUser.findMany({
    include: {
      scope: true,
      group: true,
    },
  });
};

export const fetchUserById = async (id: string) => {
  const user = await prisma.dimUser.findUnique({
    where: { id },
    include: { scope: true, group: true },
  });

  if (!user) throw new Error("USER_NOT_FOUND");
  return user;
};

export const assignUserRole = async (id: string, data: AssignRoleDto) => {
  const user = await prisma.dimUser.findUnique({ where: { id } });
  if (!user) throw new Error("USER_NOT_FOUND");

  // 1. Normalize undefined to null.
  // This completely fixes the TypeScript 'exactOptionalPropertyTypes' error
  // and guarantees our strict matrix validation works accurately.
  const scopeId = data.scopeId ?? null;
  const groupId = data.groupId ?? null;
  const psgcCode = data.psgcCode ?? null;

  let scope = null;
  if (scopeId) {
    scope = await prisma.dimScope.findUnique({ where: { id: scopeId } });
    if (!scope) throw new Error("INVALID_SCOPE");
  }

  // --- STRICT MATRIX VALIDATION LOGIC ---
  if (data.role === "SUPERADMIN") {
    if (
      scope?.value !== "SUPERADMIN" ||
      !groupId ||
      psgcCode !== "SUPERADMIN"
    ) {
      throw new Error("INVALID_SUPERADMIN_CONFIG");
    }
  } else if (data.role === "AGENT") {
    if (!scope) throw new Error("AGENT_REQUIRES_SCOPE");

    if (scope.value === "NATIONAL") {
      if (!groupId || psgcCode !== null) {
        throw new Error("INVALID_NATIONAL_AGENT_CONFIG");
      }
    } else {
      // Local Agent (Region, Province, District, City, Barangay)
      if (groupId !== null || !psgcCode) {
        throw new Error("INVALID_LOCAL_AGENT_CONFIG");
      }
    }
  } else if (data.role === "USER") {
    if (scopeId !== null || groupId !== null || psgcCode !== null) {
      throw new Error("INVALID_USER_CONFIG");
    }
  }

  // 2. Pass the normalized variables to Prisma
  return await prisma.dimUser.update({
    where: { id },
    data: {
      role: data.role as UserRole,
      scopeId: scopeId,
      groupId: groupId,
      psgcCode: psgcCode,
    },
    include: { scope: true, group: true },
  });
};
