import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
export { Prisma };

// Either the normal client or a transaction-scoped client (the `tx` a service function
// receives when called from inside another service's `prisma.$transaction(...)`, e.g.
// field.service.ts's composite create/edit running across several tables atomically).
// Every service's bulk "...With(db, ...)" function takes this, so it can run standalone
// OR participate in a caller's own transaction.
export type DbClient = typeof prisma | Prisma.TransactionClient;
