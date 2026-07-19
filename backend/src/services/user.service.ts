import { prisma } from "../utils/prisma.js";
import { UserRole } from "../generated/prisma/client.js";
import type { AssignRoleDto, CreateUserDto } from "../requests/user.request.js";
import { validateRoleConfig } from "./userAccess.service.js";
import { hashPassword, omitPassHash } from "../utils/password.js";

export const fetchAllUsers = async () => {
  const users = await prisma.dimUser.findMany({
    where: { deletedAt: null },
    include: {
      scope: true,
      group: true,
    },
  });
  return users.map(omitPassHash);
};

export const fetchUserById = async (id: string) => {
  const user = await prisma.dimUser.findFirst({
    where: { id, deletedAt: null },
    include: { scope: true, group: true },
  });

  if (!user) throw new Error("USER_NOT_FOUND");
  return omitPassHash(user);
};

export const assignUserRole = async (id: string, data: AssignRoleDto, actingUser: any) => {
  const user = await prisma.dimUser.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw new Error("USER_NOT_FOUND");

  // Normalize undefined to null so the matrix validation is exact.
  const scopeId = data.scopeId ?? null;
  const groupId = data.groupId ?? null;
  const psgcCode = data.psgcCode ?? null;

  let scope = null;
  if (scopeId) {
    scope = await prisma.dimScope.findUnique({ where: { id: scopeId } });
    if (!scope) throw new Error("INVALID_SCOPE");
  }

  validateRoleConfig(data.role as UserRole, scope, groupId, scopeId, psgcCode);

  const updatedUser = await prisma.dimUser.update({
    where: { id },
    data: {
      role: data.role as UserRole,
      scopeId,
      groupId,
      psgcCode,
      updatedById: actingUser.id,
    },
    include: { scope: true, group: true },
  });

  return omitPassHash(updatedUser);
};

export const createUser = async (data: CreateUserDto, actingUser: any) => {
  const scopeId = data.scopeId ?? null;
  const groupId = data.groupId ?? null;
  const psgcCode = data.psgcCode ?? null;

  let scope = null;
  if (scopeId) {
    scope = await prisma.dimScope.findUnique({ where: { id: scopeId } });
    if (!scope) throw new Error("INVALID_SCOPE");
  }

  validateRoleConfig(data.role as UserRole, scope, groupId, scopeId, psgcCode);

  const passHash = data.role === "USER" ? null : await hashPassword(data.password!);

  const newUser = await prisma.dimUser.create({
    data: {
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      middleName: data.middleName ?? null,
      lastName: data.lastName,
      role: data.role as UserRole,
      scopeId,
      groupId,
      psgcCode,
      passHash,
      createdById: actingUser.id,
    },
    include: { scope: true, group: true },
  });

  return omitPassHash(newUser);
};

export const setUserActive = async (id: string, active: boolean, actingUser: any) => {
  const user = await prisma.dimUser.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw new Error("USER_NOT_FOUND");

  const updatedUser = await prisma.dimUser.update({
    where: { id },
    data: { active, updatedById: actingUser.id },
    include: { scope: true, group: true },
  });

  return omitPassHash(updatedUser);
};

export const deleteUser = async (id: string, actingUser: any) => {
  const user = await prisma.dimUser.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw new Error("USER_NOT_FOUND");

  const deletedAt = new Date();
  await prisma.dimUser.update({
    where: { id },
    data: { deletedAt, updatedById: actingUser.id },
  });

  return { id, deletedAt };
};
