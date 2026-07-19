import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";

export const mockAuth = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers["x-user-id"] as string;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "You must be authenticated to perform this action.",
      error: "No 'x-user-id' header provided.",
      errorCode: "UNAUTHORIZED",
      data: null,
    });
  }

  const user = await prisma.dimUser.findUnique({
    where: { id: userId },
    include: { scope: true, group: true }
  });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "You must be authenticated to perform this action.",
      error: "No user found for the provided 'x-user-id'.",
      errorCode: "UNAUTHORIZED",
      data: null,
    });
  }

  req.user = user;
  next();
};