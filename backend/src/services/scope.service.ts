import { prisma } from "../utils/prisma.js";

export const fetchAllScopes = async () => {
  return prisma.dimScope.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
};
