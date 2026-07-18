import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger.js";

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err);
  res.status(500).json({ message: "Internal server error" });
};
