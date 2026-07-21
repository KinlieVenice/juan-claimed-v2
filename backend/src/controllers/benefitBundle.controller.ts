import type { Request, Response } from "express";
import {
  createBenefitBundle as createBenefitBundleService,
  editBenefitBundle as editBenefitBundleService,
} from "../services/benefitBundle.service.js";
import { notifyEligibleUsersOfNewBenefit } from "../services/benefitNotification.service.js";
import { handleApiError } from "../utils/errorMapping.util.js";
import { sendSuccess, sendUnauthorized } from "../utils/apiResponse.util.js";

// fileSize is BigInt on FctAttachment — JSON.stringify throws on BigInt, so
// every attachment nested in the bundle response needs the same string
// coercion benefitAttachment.controller.ts does for the plain attachment
// endpoints.
const serializeBundle = (bundle: any) => ({
  ...bundle,
  requirements: bundle.requirements.map((r: any) => ({
    ...r,
    attachments: r.attachments.map((a: any) => ({ ...a, fileSize: a.fileSize?.toString() })),
  })),
  utilizations: bundle.utilizations.map((u: any) => ({
    ...u,
    attachments: u.attachments.map((a: any) => ({ ...a, fileSize: a.fileSize?.toString() })),
  })),
  howToApplies: bundle.howToApplies.map((h: any) => ({
    ...h,
    attachments: h.attachments.map((a: any) => ({ ...a, fileSize: a.fileSize?.toString() })),
  })),
});

export const createBenefitBundle = async (req: Request, res: Response) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const bundle = await createBenefitBundleService(req.body, req.user);

    // Fire-and-forget — not awaited, so a slow/failing eGov SMS push never delays or fails
    // this response. See benefitNotification.service.ts for the per-user isolation inside.
    notifyEligibleUsersOfNewBenefit(bundle.id, bundle.name).catch((error) =>
      console.error(`[BenefitBundleController] notifyEligibleUsersOfNewBenefit failed for benefit ${bundle.id}:`, error),
    );

    return sendSuccess(res, 201, "Benefit created successfully.", serializeBundle(bundle));
  } catch (error: any) {
    handleApiError(
      error,
      res,
      "This PSGC code is already linked to this benefit.",
    );
  }
};

export const editBenefitBundle = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const bundle = await editBenefitBundleService(req.params.id, req.body, req.user);

    return sendSuccess(res, 200, "Benefit updated successfully.", serializeBundle(bundle));
  } catch (error: any) {
    handleApiError(
      error,
      res,
      "This PSGC code is already linked to this benefit.",
    );
  }
};
