import type { Request } from "express";
import { z } from "zod";

export const createBenefitSchema = z
  .object({
    name: z.string().min(1),
    englishDescription: z.string(),
    tagalogDescription: z.string(),
    nationwide: z.boolean().optional().default(false),
    psgcCodes: z.array(z.string().min(1)).optional().default([]),
    groupIds: z.array(z.string().min(1)).optional().default([]),
  })
  .refine((data) => data.nationwide || data.psgcCodes.length > 0, {
    message: "psgcCodes must contain at least one code unless nationwide is true.",
    path: ["psgcCodes"],
  });

export type CreateBenefitDto = z.infer<typeof createBenefitSchema>;

export type CreateBenefitRequest = Request<{}, {}, CreateBenefitDto>;

// Edit is a full replace of the same shape as create — reuse the schema.
export const editBenefitSchema = createBenefitSchema;
export type EditBenefitDto = CreateBenefitDto;
export type EditBenefitRequest = Request<{ id: string }, {}, EditBenefitDto>;
