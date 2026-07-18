import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

export const validateBody = (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid request payload.",
      error: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
      errorCode: "VALIDATION_ERROR",
      data: null,
    });
  }

  req.body = result.data;
  next();
};
