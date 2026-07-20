import type { Request, Response } from "express";
import {
  listHowToApplies,
  createHowToApply,
  editHowToApply,
  deleteHowToApply,
} from "../services/benefitHowToApply.service.js";
import { handleApiError } from "../utils/errorMapping.util.js";
import { sendSuccess, sendUnauthorized } from "../utils/apiResponse.util.js";

export const listBenefitHowToApplies = async (
  req: Request<{ benefitId: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const howToApplies = await listHowToApplies(req.params.benefitId, req.user);
    return sendSuccess(
      res,
      200,
      "How to Apply entries loaded successfully.",
      howToApplies,
    );
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const createBenefitHowToApply = async (
  req: Request<{ benefitId: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const howToApply = await createHowToApply(
      req.params.benefitId,
      req.body,
      req.user,
    );
    return sendSuccess(
      res,
      201,
      "How to Apply entry created successfully.",
      howToApply,
    );
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const editBenefitHowToApply = async (
  req: Request<{ benefitId: string; id: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const howToApply = await editHowToApply(
      req.params.benefitId,
      req.params.id,
      req.body,
      req.user,
    );
    return sendSuccess(
      res,
      200,
      "How to Apply entry updated successfully.",
      howToApply,
    );
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const deleteBenefitHowToApply = async (
  req: Request<{ benefitId: string; id: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const result = await deleteHowToApply(
      req.params.benefitId,
      req.params.id,
      req.user,
    );
    return sendSuccess(res, 200, "How to Apply entry deleted successfully.", result);
  } catch (error: any) {
    handleApiError(error, res);
  }
};
