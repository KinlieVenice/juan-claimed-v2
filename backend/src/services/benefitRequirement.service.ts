import { prisma } from "../utils/prisma.js";
import { assertUserCanModifyBenefit } from "./benefitLocation.service.js";

export const listRequirements = async (benefitId: string, user: any) => {
  await assertUserCanModifyBenefit(benefitId, user);

  return prisma.fctBenefitRequirement.findMany({
    where: { benefitId, deletedAt: null },
  });
};

export const createRequirement = async (benefitId: string, data: any, user: any) => {
  await assertUserCanModifyBenefit(benefitId, user);

  return prisma.fctBenefitRequirement.create({
    data: {
      benefitId,
      englishName: data.englishName,
      tagalogName: data.tagalogName,
      englishDescription: data.englishDescription,
      tagalogDescription: data.tagalogDescription,
      createdById: user.id,
    },
  });
};

export const editRequirement = async (
  benefitId: string,
  id: string,
  data: any,
  user: any,
) => {
  await assertUserCanModifyBenefit(benefitId, user);

  const existing = await prisma.fctBenefitRequirement.findFirst({
    where: { id, benefitId, deletedAt: null },
  });
  if (!existing) throw new Error("REQUIREMENT_NOT_FOUND");

  return prisma.fctBenefitRequirement.update({
    where: { id },
    data: {
      englishName: data.englishName,
      tagalogName: data.tagalogName,
      englishDescription: data.englishDescription,
      tagalogDescription: data.tagalogDescription,
      updatedById: user.id,
    },
  });
};

export const deleteRequirement = async (benefitId: string, id: string, user: any) => {
  await assertUserCanModifyBenefit(benefitId, user);

  const existing = await prisma.fctBenefitRequirement.findFirst({
    where: { id, benefitId, deletedAt: null },
  });
  if (!existing) throw new Error("REQUIREMENT_NOT_FOUND");

  return prisma.fctBenefitRequirement.update({
    where: { id },
    data: { deletedAt: new Date(), updatedById: user.id },
  });
};
