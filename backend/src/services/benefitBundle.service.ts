import { prisma } from "../utils/prisma.js";
import { createBenefit, editBenefit } from "./benefit.service.js";
import { createRequirement, editRequirement } from "./benefitRequirement.service.js";
import { createUtilization, editUtilization } from "./benefitUtilization.service.js";
import { createHowToApply, editHowToApply } from "./benefitHowToApply.service.js";
import { createParentAttachment, editParentAttachment } from "./benefitAttachment.service.js";
import { createBenefitRuleTreeWith, editBenefitRuleTreeWith, fetchBenefitRuleTreeWith } from "./benefitRuleGroup.service.js";

/**
 * Orchestrates a single "create everything" call by composing the existing
 * benefit/requirement/utilization/how-to-apply/attachment services, all run inside one
 * `prisma.$transaction`. Every service call below takes the transaction's
 * `tx` client instead of the global `prisma` singleton, so a failure at any
 * point (bad PSGC code, forbidden scope, invalid attachment type, etc.)
 * rolls back everything created so far in this call — no partial benefit.
 */
export const createBenefitBundle = async (data: any, user: any) => {
  return prisma.$transaction(async (tx) => {
    const benefit = await createBenefit(data, user, tx);

    const requirements = [];

    for (const reqData of data.requirements ?? []) {
      const requirement = await createRequirement(benefit.id, reqData, user, tx);

      const attachments = [];
      for (const attachmentData of reqData.attachments ?? []) {
        const attachment = await createParentAttachment(
          "REQUIREMENT",
          benefit.id,
          requirement.id,
          attachmentData,
          user,
          tx,
        );
        attachments.push(attachment);
      }

      requirements.push({ ...requirement, attachments });
    }

    const utilizations = [];

    for (const utilData of data.utilizations ?? []) {
      const utilization = await createUtilization(benefit.id, utilData, user, tx);

      const attachments = [];
      for (const attachmentData of utilData.attachments ?? []) {
        const attachment = await createParentAttachment(
          "UTILIZATION",
          benefit.id,
          utilization.id,
          attachmentData,
          user,
          tx,
        );
        attachments.push(attachment);
      }

      utilizations.push({ ...utilization, attachments });
    }

    const howToApplies = [];

    for (const howToApplyData of data.howToApplies ?? []) {
      const howToApply = await createHowToApply(benefit.id, howToApplyData, user, tx);

      const attachments = [];
      for (const attachmentData of howToApplyData.attachments ?? []) {
        const attachment = await createParentAttachment(
          "HOW_TO_APPLY",
          benefit.id,
          howToApply.id,
          attachmentData,
          user,
          tx,
        );
        attachments.push(attachment);
      }

      howToApplies.push({ ...howToApply, attachments });
    }

    if (data.eligibilityTree) {
      await createBenefitRuleTreeWith(tx, benefit.id, data.eligibilityTree);
    }
    const eligibilityTree = await fetchBenefitRuleTreeWith(tx, benefit.id);

    return { ...benefit, requirements, utilizations, howToApplies, eligibilityTree };
  });
};

/**
 * Same idea as createBenefitBundle, but edits the benefit and upserts its
 * requirements/utilizations/how-to-apply entries/attachments in one transactional call: each
 * item with an `id` is edited in place, each item without one is created
 * fresh. Items that already exist but are omitted from the payload are left
 * untouched — this does not delete anything, use the individual DELETE
 * endpoints for that. `eligibilityTree`, when present, wholesale-replaces the existing tree
 * (see editBenefitRuleTreeWith); omit it entirely to leave the existing tree untouched.
 */
export const editBenefitBundle = async (benefitId: string, data: any, user: any) => {
  return prisma.$transaction(async (tx) => {
    const benefit = await editBenefit(benefitId, data, user, tx);

    const requirements = [];

    for (const reqData of data.requirements ?? []) {
      const requirement = reqData.id
        ? await editRequirement(benefitId, reqData.id, reqData, user, tx)
        : await createRequirement(benefitId, reqData, user, tx);

      const attachments = [];
      for (const attachmentData of reqData.attachments ?? []) {
        const attachment = attachmentData.id
          ? await editParentAttachment(
              "REQUIREMENT",
              benefitId,
              requirement.id,
              attachmentData.id,
              attachmentData,
              user,
              tx,
            )
          : await createParentAttachment(
              "REQUIREMENT",
              benefitId,
              requirement.id,
              attachmentData,
              user,
              tx,
            );
        attachments.push(attachment);
      }

      requirements.push({ ...requirement, attachments });
    }

    const utilizations = [];

    for (const utilData of data.utilizations ?? []) {
      const utilization = utilData.id
        ? await editUtilization(benefitId, utilData.id, utilData, user, tx)
        : await createUtilization(benefitId, utilData, user, tx);

      const attachments = [];
      for (const attachmentData of utilData.attachments ?? []) {
        const attachment = attachmentData.id
          ? await editParentAttachment(
              "UTILIZATION",
              benefitId,
              utilization.id,
              attachmentData.id,
              attachmentData,
              user,
              tx,
            )
          : await createParentAttachment(
              "UTILIZATION",
              benefitId,
              utilization.id,
              attachmentData,
              user,
              tx,
            );
        attachments.push(attachment);
      }

      utilizations.push({ ...utilization, attachments });
    }

    const howToApplies = [];

    for (const howToApplyData of data.howToApplies ?? []) {
      const howToApply = howToApplyData.id
        ? await editHowToApply(benefitId, howToApplyData.id, howToApplyData, user, tx)
        : await createHowToApply(benefitId, howToApplyData, user, tx);

      const attachments = [];
      for (const attachmentData of howToApplyData.attachments ?? []) {
        const attachment = attachmentData.id
          ? await editParentAttachment(
              "HOW_TO_APPLY",
              benefitId,
              howToApply.id,
              attachmentData.id,
              attachmentData,
              user,
              tx,
            )
          : await createParentAttachment(
              "HOW_TO_APPLY",
              benefitId,
              howToApply.id,
              attachmentData,
              user,
              tx,
            );
        attachments.push(attachment);
      }

      howToApplies.push({ ...howToApply, attachments });
    }

    if (data.eligibilityTree) {
      await editBenefitRuleTreeWith(tx, benefitId, data.eligibilityTree);
    }
    const eligibilityTree = await fetchBenefitRuleTreeWith(tx, benefitId);

    return { ...benefit, requirements, utilizations, howToApplies, eligibilityTree };
  });
};
