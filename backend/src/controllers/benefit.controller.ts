import type { Request, Response } from "express";
import {
  listBenefits as listBenefitsService,
  getBenefitById as getBenefitByIdService,
  createBenefit as createBenefitService,
  editBenefit as editBenefitService,
  deleteBenefit as deleteBenefitService,
} from "../services/benefit.service.js";
import { handleApiError } from "../utils/errorMapping.util.js";
import { sendSuccess, sendUnauthorized } from "../utils/apiResponse.util.js";

export const listBenefits = async (req: Request, res: Response) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    // The Agent-side admin "Benefit" module only shows benefits relevant to the agent's own
    // jurisdiction (nationwide + anything scoped over their own location) — Superadmin (and
    // regular USER, for its own separate eligibility-facing flow) keep seeing the full
    // catalog unfiltered. See listBenefits/isBenefitVisibleToScope for the actual rule.
    const scopeFilterUser = req.user.role === "AGENT" ? req.user : undefined;
    const benefits = await listBenefitsService(scopeFilterUser);

    return sendSuccess(res, 200, "Benefits loaded successfully.", benefits);
  } catch (error: any) {
    handleApiError(error, res);
  }
};

// No-auth counterpart for the "public/no account" flow — same catalog data any signed-in
// USER already sees (listBenefitsService isn't scoped by user at all), just without the
// req.user gate above.
export const listPublicBenefits = async (_req: Request, res: Response) => {
  try {
    const benefits = await listBenefitsService();
    return sendSuccess(res, 200, "Benefits loaded successfully.", benefits);
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const getBenefitById = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const benefit = await getBenefitByIdService(req.params.id);

    return sendSuccess(
      res,
      200,
      "Benefit details loaded successfully.",
      benefit,
    );
  } catch (error: any) {
    handleApiError(error, res);
  }
};

// No-auth counterpart for the "public/no account" flow's single-benefit page.
export const getPublicBenefitById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const benefit = await getBenefitByIdService(req.params.id);
    return sendSuccess(res, 200, "Benefit details loaded successfully.", benefit);
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const createBenefit = async (req: Request, res: Response) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const benefit = await createBenefitService(req.body, req.user);

    return sendSuccess(res, 201, "Benefit created successfully.", benefit);
  } catch (error: any) {
    handleApiError(
      error,
      res,
      "This PSGC code is already linked to this benefit.",
    );
  }
};

export const editBenefit = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const benefit = await editBenefitService(req.params.id, req.body, req.user);

    return sendSuccess(res, 200, "Benefit updated successfully.", benefit);
  } catch (error: any) {
    handleApiError(
      error,
      res,
      "This PSGC code is already linked to this benefit.",
    );
  }
};

export const deleteBenefit = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const result = await deleteBenefitService(req.params.id, req.user);

    return sendSuccess(res, 200, "Benefit deleted successfully.", result);
  } catch (error: any) {
    handleApiError(error, res);
  }
};
