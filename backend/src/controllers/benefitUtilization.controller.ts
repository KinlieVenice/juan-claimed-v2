import type { Request, Response } from "express";
import {
  listUtilizations,
  createUtilization,
  editUtilization,
  deleteUtilization,
} from "../services/benefitUtilization.service.js";
import { handleApiError } from "../utils/errorMapping.util.js";
import { sendSuccess, sendUnauthorized } from "../utils/apiResponse.util.js";

export const listBenefitUtilizations = async (
  req: Request<{ benefitId: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const utilizations = await listUtilizations(req.params.benefitId, req.user);
    return sendSuccess(
      res,
      200,
      "Utilizations loaded successfully.",
      utilizations,
    );
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const createBenefitUtilization = async (
  req: Request<{ benefitId: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const utilization = await createUtilization(
      req.params.benefitId,
      req.body,
      req.user,
    );
    return sendSuccess(
      res,
      201,
      "Utilization created successfully.",
      utilization,
    );
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const editBenefitUtilization = async (
  req: Request<{ benefitId: string; id: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const utilization = await editUtilization(
      req.params.benefitId,
      req.params.id,
      req.body,
      req.user,
    );
    return sendSuccess(
      res,
      200,
      "Utilization updated successfully.",
      utilization,
    );
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const deleteBenefitUtilization = async (
  req: Request<{ benefitId: string; id: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const result = await deleteUtilization(
      req.params.benefitId,
      req.params.id,
      req.user,
    );
    return sendSuccess(res, 200, "Utilization deleted successfully.", result);
  } catch (error: any) {
    handleApiError(error, res);
  }
};
