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

export const createUserSchema = z
  .object({
    username: z.string().min(1),
    email: z.string().email(),
    firstName: z.string().min(1),
    middleName: z.string().optional(),
    lastName: z.string().min(1),
    role: z.enum(["SUPERADMIN", "AGENT", "USER"]),
    scopeId: z.string().nullable().optional(),
    groupId: z.string().nullable().optional(),
    psgcCode: z.string().nullable().optional(),
    password: z.string().min(8).optional(),
  })
  .refine((data) => (data.role === "USER" ? !data.password : !!data.password), {
    message: "password is required for SUPERADMIN/AGENT and must be omitted for USER",
    path: ["password"],
  });

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type CreateUserRequest = Request<{}, {}, CreateUserDto>;

export const setUserActiveSchema = z.object({
  active: z.boolean(),
});

export type SetUserActiveDto = z.infer<typeof setUserActiveSchema>;
export type SetUserActiveRequest = Request<{ id: string }, {}, SetUserActiveDto>;
