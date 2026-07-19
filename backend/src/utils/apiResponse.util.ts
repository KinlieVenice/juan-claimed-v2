import type { Response } from "express";

/**
 * Shape B envelope: { success, message, error, errorCode, data } on both
 * success and error. Used by benefit + benefit-child controllers so every
 * route in the API responds with the same envelope shape.
 */
export const sendSuccess = (res: Response, status: number, message: string, data: unknown) => {
  return res.status(status).json({ success: true, message, error: null, errorCode: null, data });
};

export const sendUnauthorized = (res: Response) => {
  return res.status(401).json({
    success: false,
    message: "You must be authenticated to perform this action.",
    error: "No authenticated user found on the request.",
    errorCode: "UNAUTHORIZED",
    data: null,
  });
};
