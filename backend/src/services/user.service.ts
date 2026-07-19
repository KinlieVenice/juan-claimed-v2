import { prisma } from "../utils/prisma.js";
import { UserRole } from "../generated/prisma/client.js";
import type { AssignRoleDto, CreateUserDto } from "../requests/user.request.js";
import { validateRoleConfig } from "./userAccess.service.js";
import { hashPassword } from "../utils/password.js";

const omitPassHash = <T extends { passHash?: unknown }>(user: T) => {
  const { passHash: _omit, ...safeUser } = user;
  return safeUser;
};

export const fetchAllUsers = async () => {
  const users = await prisma.dimUser.findMany({
    include: {
      scope: true,
      group: true,
    },
  });
  return users.map(omitPassHash);
};

export const fetchUserById = async (id: string) => {
  const user = await prisma.dimUser.findUnique({
    where: { id },
    include: { scope: true, group: true },
  });

  if (!user) throw new Error("USER_NOT_FOUND");
  return omitPassHash(user);
};

export const assignUserRole = async (id: string, data: AssignRoleDto, actingUser: any) => {
  const user = await prisma.dimUser.findUnique({ where: { id } });
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
