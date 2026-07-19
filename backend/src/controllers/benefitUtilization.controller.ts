import type { Request, Response } from "express";
import {
  listUtilizations,
  createUtilization,
  editUtilization,
  deleteUtilization,
} from "../services/benefitUtilization.service.js";
import { handleApiError } from "../utils/errorMapping.js";

export const listBenefitUtilizations = async (
  req: Request<{ benefitId: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const utilizations = await listUtilizations(req.params.benefitId, req.user);
    res.status(200).json({ success: true, data: utilizations });
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const createBenefitUtilization = async (
  req: Request<{ benefitId: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const utilization = await createUtilization(req.params.benefitId, req.body, req.user);
    res.status(201).json({ success: true, data: utilization });
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const editBenefitUtilization = async (
  req: Request<{ benefitId: string; id: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const utilization = await editUtilization(
      req.params.benefitId,
      req.params.id,
      req.body,
      req.user,
    );
    res.status(200).json({ success: true, data: utilization });
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const deleteBenefitUtilization = async (
  req: Request<{ benefitId: string; id: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const result = await deleteUtilization(req.params.benefitId, req.params.id, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    handleApiError(error, res);
  }
};
