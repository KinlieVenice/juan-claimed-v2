import type { Request } from "express";
import { z } from "zod";

export const benefitHowToApplySchema = z.object({
  englishName: z.string().min(1),
  tagalogName: z.string().min(1),
  englishDescription: z.string().min(1),
  tagalogDescription: z.string().min(1),
});

export type BenefitHowToApplyDto = z.infer<typeof benefitHowToApplySchema>;

export type CreateBenefitHowToApplyRequest = Request<
  { benefitId: string },
  {},
  BenefitHowToApplyDto
>;
export type EditBenefitHowToApplyRequest = Request<
  { benefitId: string; id: string },
  {},
  BenefitHowToApplyDto
>;
