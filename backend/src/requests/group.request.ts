import type { Request } from "express";
import { z } from "zod";

export const createUpdateGroupSchema = z.object({
  englishName: z.string().min(1),
  tagalogName: z.string().min(1),
  englishDescription: z.string(),
  tagalogDescription: z.string(),
});

export type CreateUpdateGroupDto = z.infer<typeof createUpdateGroupSchema>;

export type CreateGroupRequest = Request<{}, {}, CreateUpdateGroupDto>;
export type UpdateGroupRequest = Request<
  { id: string },
  {},
  CreateUpdateGroupDto
>;
