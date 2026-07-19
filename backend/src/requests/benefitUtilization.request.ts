import type { Request } from "express";
import { z } from "zod";

export const benefitUtilizationSchema = z.object({
  englishName: z.string().min(1),
  tagalogName: z.string().min(1),
  englishDescription: z.string().min(1),
  tagalogDescription: z.string().min(1),
});

export type BenefitUtilizationDto = z.infer<typeof benefitUtilizationSchema>;

export type CreateBenefitUtilizationRequest = Request<
  { benefitId: string },
  {},
  BenefitUtilizationDto
>;
export type EditBenefitUtilizationRequest = Request<
  { benefitId: string; id: string },
  {},
  BenefitUtilizationDto
>;
