import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";

export const mockAuth = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.headers["x-user-id"] as string;

  if (!userId) {
    return res.status(401).json({ 
      success: false, 
      message: "Mock Auth Error: No 'x-user-id' header provided." 
    });
  }

  const user = await prisma.dimUser.findUnique({ 
    where: { id: userId },
    include: { scope: true, group: true } 
  });

  if (!user) {
    return res.status(401).json({ 
      success: false, 
      message: "Mock Auth Error: User not found." 
    });
  }

  req.user = user;
  next();
};