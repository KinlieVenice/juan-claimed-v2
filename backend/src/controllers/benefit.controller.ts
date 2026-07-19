import type { Request, Response } from "express";
import {
  createBenefit as createBenefitService,
  editBenefit as editBenefitService,
  deleteBenefit as deleteBenefitService,
} from "../services/benefit.service.js";

const handleBenefitError = (error: any, res: Response) => {
  if (error.code === "P2002") {
    return res.status(409).json({ success: false, message: "This PSGC code is already linked to this benefit." });
  }

  const message: string = error.message || "";
  if (message.endsWith("_NOT_FOUND") && !message.startsWith("SCOPE_NOT_FOUND")) {
    return res.status(404).json({ success: false, message });
  }
  if (message.startsWith("INVALID_INPUT") || message.startsWith("INVALID_PSGC_CODE")) {
    return res.status(400).json({ success: false, message });
  }
  if (message.startsWith("SCOPE_NOT_FOUND")) {
    return res.status(500).json({ success: false, message });
  }
  if (message.startsWith("FORBIDDEN") || message.startsWith("UNAUTHORIZED_SCOPE")) {
    return res.status(403).json({ success: false, message });
  }

  return res.status(500).json({ success: false, message: message || "Internal server error." });
};

export const createBenefit = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const benefit = await createBenefitService(req.body, req.user);

    res.status(201).json({ success: true, data: benefit });
  } catch (error: any) {
    handleBenefitError(error, res);
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
    handleBenefitError(error, res);
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
    handleBenefitError(error, res);
  }
};
