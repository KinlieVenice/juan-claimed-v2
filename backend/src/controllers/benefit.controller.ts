import type { Request, Response } from "express";
import {
  listBenefits as listBenefitsService,
  getBenefitById as getBenefitByIdService,
  createBenefit as createBenefitService,
  editBenefit as editBenefitService,
  deleteBenefit as deleteBenefitService,
} from "../services/benefit.service.js";
import { handleApiError } from "../utils/errorMapping.js";

export const listBenefits = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const benefits = await listBenefitsService();

    res.status(200).json({ success: true, data: benefits });
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const getBenefitById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const benefit = await getBenefitByIdService(req.params.id);

    res.status(200).json({ success: true, data: benefit });
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const createBenefit = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const benefit = await createBenefitService(req.body, req.user);

    res.status(201).json({ success: true, data: benefit });
  } catch (error: any) {
    handleApiError(error, res, "This PSGC code is already linked to this benefit.");
  }
};

export const editBenefit = async (req: Request<{ id: string }>, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const benefit = await editBenefitService(req.params.id, req.body, req.user);

    res.status(200).json({ success: true, data: benefit });
  } catch (error: any) {
    handleApiError(error, res, "This PSGC code is already linked to this benefit.");
  }
};

export const deleteBenefit = async (req: Request<{ id: string }>, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await deleteBenefitService(req.params.id, req.user);

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    handleApiError(error, res);
  }
};
