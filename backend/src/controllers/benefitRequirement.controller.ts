import type { Request, Response } from "express";
import {
  listRequirements,
  createRequirement,
  editRequirement,
  deleteRequirement,
} from "../services/benefitRequirement.service.js";
import { handleApiError } from "../utils/errorMapping.js";

export const listBenefitRequirements = async (
  req: Request<{ benefitId: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const requirements = await listRequirements(req.params.benefitId, req.user);
    res.status(200).json({ success: true, data: requirements });
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const createBenefitRequirement = async (
  req: Request<{ benefitId: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const requirement = await createRequirement(req.params.benefitId, req.body, req.user);
    res.status(201).json({ success: true, data: requirement });
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const editBenefitRequirement = async (
  req: Request<{ benefitId: string; id: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const requirement = await editRequirement(
      req.params.benefitId,
      req.params.id,
      req.body,
      req.user,
    );
    res.status(200).json({ success: true, data: requirement });
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const deleteBenefitRequirement = async (
  req: Request<{ benefitId: string; id: string }>,
  res: Response,
) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const result = await deleteRequirement(req.params.benefitId, req.params.id, req.user);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    handleApiError(error, res);
  }
};
