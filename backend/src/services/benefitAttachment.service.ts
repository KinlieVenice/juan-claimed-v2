import { prisma } from "../utils/prisma.js";
import { assertUserCanModifyBenefit } from "./benefitLocation.service.js";
import { ATTACHMENT_ENTITY_TYPES } from "../constants/attachmentEntityTypes.js";

const entityWhere = (benefitId: string) => ({
  entityType: ATTACHMENT_ENTITY_TYPES.BENEFIT,
  entityId: benefitId,
});

export const listAttachments = async (benefitId: string, user: any) => {
  await assertUserCanModifyBenefit(benefitId, user);

  return prisma.fctAttachment.findMany({
    where: { ...entityWhere(benefitId), deletedAt: null },
  });
};

export const createAttachment = async (benefitId: string, data: any, user: any) => {
  await assertUserCanModifyBenefit(benefitId, user);

  return prisma.fctAttachment.create({
    data: {
      ...entityWhere(benefitId),
      fileLabel: data.fileLabel,
      fileName: data.fileName,
      fileType: data.fileType,
      filePath: data.filePath,
      fileSize: BigInt(data.fileSize),
      metaData: data.metaData ?? {},
      createdById: user.id,
    },
  });
};

export const editAttachment = async (
  benefitId: string,
  id: string,
  data: any,
  user: any,
) => {
  await assertUserCanModifyBenefit(benefitId, user);

  const existing = await prisma.fctAttachment.findFirst({
    where: { id, ...entityWhere(benefitId), deletedAt: null },
  });
  if (!existing) throw new Error("ATTACHMENT_NOT_FOUND");

  return prisma.fctAttachment.update({
    where: { id },
    data: {
      fileLabel: data.fileLabel,
      fileName: data.fileName,
      fileType: data.fileType,
      filePath: data.filePath,
      fileSize: BigInt(data.fileSize),
      metaData: data.metaData ?? {},
      updatedById: user.id,
    },
  });
};

export const deleteAttachment = async (benefitId: string, id: string, user: any) => {
  await assertUserCanModifyBenefit(benefitId, user);

  const existing = await prisma.fctAttachment.findFirst({
    where: { id, ...entityWhere(benefitId), deletedAt: null },
  });
  if (!existing) throw new Error("ATTACHMENT_NOT_FOUND");

  return prisma.fctAttachment.update({
    where: { id },
    data: { deletedAt: new Date(), updatedById: user.id },
  });
};
