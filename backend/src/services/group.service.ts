import { prisma } from "../utils/prisma.js";
import type { CreateUpdateGroupDto } from "../requests/group.request.js";

export const fetchAllGroups = async () => {
  return await prisma.dimGroup.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } });
};

export const fetchGroupById = async (id: string) => {
  const group = await prisma.dimGroup.findUnique({ where: { id, deletedAt: null } });

  if (!group) {
    throw new Error("GROUP_NOT_FOUND");
  }

  return group;
};

export const addGroup = async (data: CreateUpdateGroupDto, actingUser: any) => {
  return await prisma.dimGroup.create({
    data: { ...data, createdById: actingUser.id },
  });
};

export const editGroup = async (id: string, data: CreateUpdateGroupDto, actingUser: any) => {
  const existingGroup = await prisma.dimGroup.findUnique({ where: { id } });

  if (!existingGroup) {
    throw new Error("GROUP_NOT_FOUND");
  }

  return await prisma.dimGroup.update({
    where: { id },
    data: { ...data, updatedById: actingUser.id },
  });
};
