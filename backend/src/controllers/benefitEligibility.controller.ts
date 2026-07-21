import type { Request, Response } from "express";
import {
  evaluateAllBenefitsEligibility,
  evaluateBenefitEligibilityDetailById,
  evaluateAllBenefitsEligibilityForAnswers,
  evaluateBenefitEligibilityDetailForAnswers,
} from "../services/benefitEligibility.service.js";
import type { GuestEligibilityRequest, GuestBenefitEligibilityRequest } from "../requests/benefitEligibility.request.js";
import { handleApiError } from "../utils/errorMapping.util.js";
import { sendSuccess, sendUnauthorized } from "../utils/apiResponse.util.js";

export const listMyBenefitEligibility = async (req: Request, res: Response) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const results = await evaluateAllBenefitsEligibility(req.user.id);

    return sendSuccess(res, 200, "Eligibility evaluated successfully.", results);
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const getMyBenefitEligibility = async (req: Request<{ id: string }>, res: Response) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const result = await evaluateBenefitEligibilityDetailById(req.params.id, req.user.id);

    return sendSuccess(res, 200, "Eligibility evaluated successfully.", result);
  } catch (error: any) {
    handleApiError(error, res);
  }
};

// No-auth counterpart for the "public/no account" flow — the visitor's answers travel
// inline in the request body (their browser's localStorage, see answers-store.tsx) instead
// of being resolved server-side from a stored userId.
export const listGuestBenefitEligibility = async (req: GuestEligibilityRequest, res: Response) => {
  try {
    const results = await evaluateAllBenefitsEligibilityForAnswers({ answers: req.body.answers, repeaterRows: req.body.repeaterRows });
    return sendSuccess(res, 200, "Eligibility evaluated successfully.", results);
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const getGuestBenefitEligibility = async (req: GuestBenefitEligibilityRequest, res: Response) => {
  try {
    const result = await evaluateBenefitEligibilityDetailForAnswers(req.params.id, { answers: req.body.answers, repeaterRows: req.body.repeaterRows });
    return sendSuccess(res, 200, "Eligibility evaluated successfully.", result);
  } catch (error: any) {
    handleApiError(error, res);
  }
};
