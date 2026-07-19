import type { Request } from "express";
import { z } from "zod";

export const benefitRequirementSchema = z.object({
  englishName: z.string().min(1),
  tagalogName: z.string().min(1),
  englishDescription: z.string().min(1),
  tagalogDescription: z.string().min(1),
});

export type BenefitRequirementDto = z.infer<typeof benefitRequirementSchema>;

export type CreateBenefitRequirementRequest = Request<
  { benefitId: string },
  {},
  BenefitRequirementDto
>;
export type EditBenefitRequirementRequest = Request<
  { benefitId: string; id: string },
  {},
  BenefitRequirementDto
>;
