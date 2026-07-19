import type { Request, Response } from "express";
import { createBenefit as createBenefitService } from "../services/benefit.service.js";

// Add the 'export' keyword here!
export const createBenefit = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Call your service
    const benefit = await createBenefitService(req.body, req.user);

    res.status(201).json({ success: true, data: benefit });
  } catch (error: any) {
    // Check for Prisma unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: "This PSGC code is already linked to this benefit." });
    }

    const message: string = error.message || "";
    if (message.startsWith("INVALID_INPUT") || message.startsWith("INVALID_PSGC_CODE")) {
      return res.status(400).json({ success: false, message });
    }
    if (message.startsWith("SCOPE_NOT_FOUND")) {
      return res.status(500).json({ success: false, message });
    }
    if (message.startsWith("FORBIDDEN") || message.startsWith("UNAUTHORIZED_SCOPE")) {
      return res.status(403).json({ success: false, message });
    }

    res.status(500).json({ success: false, message: message || "Internal server error." });
  }
};
