import { UserRole } from "../generated/prisma/client.js";

// Define role groups based on your project requirements
export const PERMISSIONS = {
  // Only Superadmin
  MANAGE_USERS: [UserRole.SUPERADMIN],
  MANAGE_GROUPS: [UserRole.SUPERADMIN],

  // Superadmin and Agent
  CREATE_BENEFITS: [UserRole.SUPERADMIN, UserRole.AGENT],

  // Everyone (User, Agent, Superadmin)
  PARTICIPATE: [UserRole.SUPERADMIN, UserRole.AGENT, UserRole.USER],
};
