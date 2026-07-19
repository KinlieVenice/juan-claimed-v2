import type { Request } from "express";
import { z } from "zod";

export const createBenefitSchema = z.object({
  name: z.string().min(1),
  englishDescription: z.string(),
  tagalogDescription: z.string(),
  psgcCodes: z.array(z.string().min(1)).min(1),
  groupIds: z.array(z.string().min(1)).optional().default([]),
});

export type CreateBenefitDto = z.infer<typeof createBenefitSchema>;

export type CreateBenefitRequest = Request<{}, {}, CreateBenefitDto>;
