import type { Request, Response } from "express";
import { fetchAllScopes } from "../services/scope.service.js";
import { handleApiError } from "../utils/errorMapping.util.js";
import { sendSuccess, sendUnauthorized } from "../utils/apiResponse.util.js";

export const listScopes = async (req: Request, res: Response) => {
  try {
    if (!req.user) return sendUnauthorized(res);

    const scopes = await fetchAllScopes();

    return sendSuccess(res, 200, "Scopes loaded successfully.", scopes);
  } catch (error: any) {
    handleApiError(error, res);
  }
};
