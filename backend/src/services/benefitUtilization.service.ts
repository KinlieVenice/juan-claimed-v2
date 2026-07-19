import { prisma } from "../utils/prisma.js";
import { assertUserCanModifyBenefit } from "./benefitLocation.service.js";

export const listUtilizations = async (benefitId: string, user: any) => {
  await assertUserCanModifyBenefit(benefitId, user);

  return prisma.fctBenefitUtilization.findMany({
    where: { benefitId, deletedAt: null },
  });
};

export const createUtilization = async (benefitId: string, data: any, user: any) => {
  await assertUserCanModifyBenefit(benefitId, user);

  return prisma.fctBenefitUtilization.create({
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

export const editUtilization = async (
  benefitId: string,
  id: string,
  data: any,
  user: any,
) => {
  await assertUserCanModifyBenefit(benefitId, user);

  const existing = await prisma.fctBenefitUtilization.findFirst({
    where: { id, benefitId, deletedAt: null },
  });
  if (!existing) throw new Error("UTILIZATION_NOT_FOUND");

  return prisma.fctBenefitUtilization.update({
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

export const deleteUtilization = async (benefitId: string, id: string, user: any) => {
  await assertUserCanModifyBenefit(benefitId, user);

  const existing = await prisma.fctBenefitUtilization.findFirst({
    where: { id, benefitId, deletedAt: null },
  });
  if (!existing) throw new Error("UTILIZATION_NOT_FOUND");

  return prisma.fctBenefitUtilization.update({
    where: { id },
    data: { deletedAt: new Date(), updatedById: user.id },
  });
};
