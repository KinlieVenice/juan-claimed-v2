import { prisma } from "../utils/prisma.js";
import {
  assertUserAuthorizedForBenefit,
  getScopeIdMap,
  resolvePsgcCodesForUser,
} from "./benefitLocation.service.js";

const validateBenefitInput = (data: any, user: any) => {
  const isNationwide = data.nationwide === true;
  const incomingCodes: string[] = data.psgcCodes || [];

  if (isNationwide && user.scope?.value !== "NATIONAL") {
    throw new Error(
      "FORBIDDEN: Only national users may create nationwide benefits.",
    );
  }

  if (!isNationwide && incomingCodes.length === 0) {
    throw new Error("INVALID_INPUT: At least one psgcCodes array is required.");
  }

  if (user.scope?.value === "NATIONAL" && (data.groupIds || []).length === 0) {
    throw new Error("INVALID_INPUT: National users must assign at least one group.");
  }

  return { isNationwide, incomingCodes };
};

const enrichBenefitPsgcCodes = <T extends { benefitPsgcCodes: { psgcCode: string }[] }>(
  benefit: T,
  locationNameMap: Map<string, string>,
) => ({
  ...benefit,
  benefitPsgcCodes: benefit.benefitPsgcCodes.map((pc) => ({
    ...pc,
    locationName: locationNameMap.get(pc.psgcCode),
  })),
});

export const createBenefit = async (data: any, user: any) => {
  const { isNationwide, incomingCodes } = validateBenefitInput(data, user);

  // Skipped entirely for nationwide benefits — no location rows needed.
  const resolvedCodes = isNationwide
    ? []
    : await resolvePsgcCodesForUser(incomingCodes, user);

  const locationNameMap = new Map(
    resolvedCodes.map((r) => [r.psgcCode, r.locationName]),
  );

  const psgcPayloads = resolvedCodes.map((r) => ({
    psgcCode: r.psgcCode,
    scopeId: r.scopeId,
    createdById: user.id,
  }));

  const newBenefit = await prisma.fctBenefit.create({
    data: {
      name: data.name,
      englishDescription: data.englishDescription,
      tagalogDescription: data.tagalogDescription,
      isNationwide,
      scopeId: user.scopeId, // The "owner" scope of the benefit itself
      createdById: user.id,

      benefitPsgcCodes: { create: psgcPayloads },

      benefitGroups: {
        create: (data.groupIds || []).map((gId: string) => ({
          groupId: gId,
          createdById: user.id,
        })),
      },
    },
    include: {
      benefitPsgcCodes: { include: { scope: true } },
      benefitGroups: { include: { group: true } },
    },
  });

  return enrichBenefitPsgcCodes(newBenefit, locationNameMap);
};

export const editBenefit = async (id: string, data: any, user: any) => {
  const existing = await prisma.fctBenefit.findFirst({
    where: { id, deletedAt: null },
    include: {
      benefitPsgcCodes: { where: { deletedAt: null } },
    },
  });
  if (!existing) throw new Error("BENEFIT_NOT_FOUND");

  const scopeMap = await getScopeIdMap();
  await assertUserAuthorizedForBenefit(existing, user, scopeMap);

  const { isNationwide, incomingCodes } = validateBenefitInput(data, user);

  const resolvedCodes = isNationwide
    ? []
    : await resolvePsgcCodesForUser(incomingCodes, user);

  const locationNameMap = new Map(
    resolvedCodes.map((r) => [r.psgcCode, r.locationName]),
  );

  const desiredGroupIds: string[] = data.groupIds || [];
  const desiredPsgcCodes = new Set(resolvedCodes.map((r) => r.psgcCode));

  const updatedBenefit = await prisma.$transaction(async (tx) => {
    // Soft-delete active rows that are no longer part of the desired set.
    await tx.dimBenefitPsgcCode.updateMany({
      where: {
        benefitId: id,
        deletedAt: null,
        psgcCode: { notIn: [...desiredPsgcCodes] },
      },
      data: { deletedAt: new Date(), updatedById: user.id },
    });

    await tx.dimBenefitGroup.updateMany({
      where: {
        benefitId: id,
        deletedAt: null,
        groupId: { notIn: desiredGroupIds },
      },
      data: { deletedAt: new Date(), updatedById: user.id },
    });

    // Upsert every desired row: revives a previously soft-deleted row with
    // the same key (unique constraint means it can't just be re-created),
    // or creates it fresh if it never existed.
    for (const r of resolvedCodes) {
      await tx.dimBenefitPsgcCode.upsert({
        where: { benefitId_psgcCode: { benefitId: id, psgcCode: r.psgcCode } },
        update: { scopeId: r.scopeId, deletedAt: null, updatedById: user.id },
        create: {
          benefitId: id,
          psgcCode: r.psgcCode,
          scopeId: r.scopeId,
          createdById: user.id,
        },
      });
    }

    for (const groupId of desiredGroupIds) {
      await tx.dimBenefitGroup.upsert({
        where: { benefitId_groupId: { benefitId: id, groupId } },
        update: { deletedAt: null, updatedById: user.id },
        create: { benefitId: id, groupId, createdById: user.id },
      });
    }

    return tx.fctBenefit.update({
      where: { id },
      data: {
        name: data.name,
        englishDescription: data.englishDescription,
        tagalogDescription: data.tagalogDescription,
        isNationwide,
        updatedById: user.id,
      },
      include: {
        benefitPsgcCodes: { where: { deletedAt: null }, include: { scope: true } },
        benefitGroups: { where: { deletedAt: null }, include: { group: true } },
      },
    });
  });

  return enrichBenefitPsgcCodes(updatedBenefit, locationNameMap);
};

export const deleteBenefit = async (id: string, user: any) => {
  const existing = await prisma.fctBenefit.findFirst({
    where: { id, deletedAt: null },
    include: {
      benefitPsgcCodes: { where: { deletedAt: null } },
    },
  });
  if (!existing) throw new Error("BENEFIT_NOT_FOUND");

  const scopeMap = await getScopeIdMap();
  await assertUserAuthorizedForBenefit(existing, user, scopeMap);

  const deletedAt = new Date();

  await prisma.$transaction([
    prisma.fctBenefit.update({
      where: { id },
      data: { deletedAt, updatedById: user.id },
    }),
    prisma.dimBenefitPsgcCode.updateMany({
      where: { benefitId: id, deletedAt: null },
      data: { deletedAt, updatedById: user.id },
    }),
    prisma.dimBenefitGroup.updateMany({
      where: { benefitId: id, deletedAt: null },
      data: { deletedAt, updatedById: user.id },
    }),
  ]);

  return { id, deletedAt };
};
