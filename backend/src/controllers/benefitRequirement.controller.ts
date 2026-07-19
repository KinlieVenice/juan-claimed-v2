import type { Request, Response } from "express";
import {
  listRequirements,
  createRequirement,
  editRequirement,
  deleteRequirement,
} from "../services/benefitRequirement.service.js";
import { handleApiError } from "../utils/errorMapping.util.js";
import { sendSuccess, sendUnauthorized } from "../utils/apiResponse.util.js";

export const listBenefitRequirements = async (
  req: Request<{ benefitId: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const requirements = await listRequirements(req.params.benefitId, req.user);
    return sendSuccess(
      res,
      200,
      "Requirements loaded successfully.",
      requirements,
    );
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const createBenefitRequirement = async (
  req: Request<{ benefitId: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const requirement = await createRequirement(
      req.params.benefitId,
      req.body,
      req.user,
    );
    return sendSuccess(
      res,
      201,
      "Requirement created successfully.",
      requirement,
    );
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const editBenefitRequirement = async (
  req: Request<{ benefitId: string; id: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const requirement = await editRequirement(
      req.params.benefitId,
      req.params.id,
      req.body,
      req.user,
    );
    return sendSuccess(
      res,
      200,
      "Requirement updated successfully.",
      requirement,
    );
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const deleteBenefitRequirement = async (
  req: Request<{ benefitId: string; id: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const result = await deleteRequirement(
      req.params.benefitId,
      req.params.id,
      req.user,
    );
    return sendSuccess(res, 200, "Requirement deleted successfully.", result);
  } catch (error: any) {
    handleApiError(error, res);
  }
};
