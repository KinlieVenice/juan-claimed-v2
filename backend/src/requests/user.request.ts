import type { Request } from "express";
import { z } from "zod";

export const assignRoleSchema = z.object({
  role: z.enum(["SUPERADMIN", "AGENT", "USER"]),
  scopeId: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
  psgcCode: z.string().nullable().optional(),
});

export type AssignRoleDto = z.infer<typeof assignRoleSchema>;
export type AssignRoleRequest = Request<{ id: string }, {}, AssignRoleDto>;
