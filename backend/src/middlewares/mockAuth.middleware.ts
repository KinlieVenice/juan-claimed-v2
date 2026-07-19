import type { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";
import { verifyAuthToken } from "../utils/jwt.util.js";

const unauthorized = (res: Response, error: string) =>
  res.status(401).json({
    success: false,
    message: "You must be authenticated to perform this action.",
    error,
    errorCode: "UNAUTHORIZED",
    data: null,
  });

const forbidden = (res: Response, error: string) =>
  res.status(403).json({
    success: false,
    message: "You do not have permission to perform this action.",
    error,
    errorCode: "FORBIDDEN",
    data: null,
  });

/**
 * Real auth path: verifies a Bearer JWT (issued by /api/auth/login or
 * /api/auth/google), loads the current DimUser row. Every route already
 * imports this middleware as `mockAuth` — kept under that name so no route
 * file needs to change.
 */
const authenticateWithToken = async (req: Request, res: Response, token: string) => {
  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    return unauthorized(res, "Invalid or expired token.");
  }

  const user = await prisma.dimUser.findFirst({
    where: { id: payload.sub, deletedAt: null },
    include: { scope: true, group: true },
  });

  if (!user) return unauthorized(res, "No user found for this token.");
  if (!user.active) return forbidden(res, "This account has been deactivated.");

  req.user = user;
  return null;
};

/**
 * Dev-only fallback: the original mock `x-user-id` header auth, used only
 * when no Authorization header is present and NODE_ENV isn't production —
 * keeps every previously-tested x-user-id flow working without a real
 * login, while making sure it can never silently activate in production.
 */
const authenticateWithMockHeader = async (req: Request, res: Response) => {
  const userId = req.headers["x-user-id"] as string;

  if (!userId) {
    return unauthorized(res, "No 'x-user-id' header provided.");
  }

  const user = await prisma.dimUser.findFirst({
    where: { id: userId, deletedAt: null },
    include: { scope: true, group: true },
  });

  if (!user) return unauthorized(res, "No user found for the provided 'x-user-id'.");
  if (!user.active) return forbidden(res, "This account has been deactivated.");

  req.user = user;
  return null;
};

export const mockAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length);
    const result = await authenticateWithToken(req, res, token);
    if (result === null) return next();
    return;
  }

  if (process.env.NODE_ENV === "production") {
    return unauthorized(res, "Authentication required.");
  }

  const result = await authenticateWithMockHeader(req, res);
  if (result === null) return next();
};
