import { prisma } from "../utils/prisma.js";

export const listUsers = () => prisma.dimUser.findMany();

export const createUser = (email: string, username: string, firstName: string, lastName: string) =>
  prisma.dimUser.create({ data: { email, username, firstName, lastName } });
