import type { Request, Response, NextFunction } from "express";
import { UserRole } from "../generated/prisma/client.js";

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // 1. Ensure user is authenticated (Check if mockAuth was run)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user session found.",
      });
    }

    // 2. Check if the user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have the required permissions.",
      });
    }

    next();
  };
};
