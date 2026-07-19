import { prisma } from "../utils/prisma.js";
import type { CreateUpdateGroupDto } from "../requests/group.request.js";

export const fetchAllGroups = async () => {
  return await prisma.dimGroup.findMany();
};

export const fetchGroupById = async (id: string) => {
  const group = await prisma.dimGroup.findUnique({ where: { id } });

  if (!group) {
    throw new Error("GROUP_NOT_FOUND");
  }

  return group;
};

export const addGroup = async (data: CreateUpdateGroupDto) => {
  return await prisma.dimGroup.create({
    data,
  });
};

export const editGroup = async (id: string, data: CreateUpdateGroupDto) => {
  const existingGroup = await prisma.dimGroup.findUnique({ where: { id } });

  if (!existingGroup) {
    throw new Error("GROUP_NOT_FOUND");
  }

  return await prisma.dimGroup.update({
    where: { id },
    data,
  });
};
