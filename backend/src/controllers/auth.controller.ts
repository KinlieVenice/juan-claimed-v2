import type { Request, Response } from "express";
import { loginWithPassword, loginWithGoogle, loginWithEgov, changeUserPassword } from "../services/auth.service.js";
import { handleApiError } from "../utils/errorMapping.util.js";
import { sendSuccess, sendUnauthorized } from "../utils/apiResponse.util.js";
import type { LoginRequest, GoogleLoginRequest, EgovLoginRequest, ChangePasswordRequest } from "../requests/auth.request.js";
import { omitPassHash } from "../utils/password.js";

export const login = async (req: LoginRequest, res: Response) => {
  try {
    const result = await loginWithPassword(req.body.username, req.body.password);
    return sendSuccess(res, 200, "Logged in successfully.", result);
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const googleLogin = async (req: GoogleLoginRequest, res: Response) => {
  try {
    const result = await loginWithGoogle(req.body.idToken);
    return sendSuccess(res, 200, "Logged in successfully.", result);
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const egovLogin = async (req: EgovLoginRequest, res: Response) => {
  try {
    const result = await loginWithEgov(req.body.exchangeCode);
    return sendSuccess(res, 200, "Logged in successfully.", result);
  } catch (error: any) {
    handleApiError(error, res);
  }
};

export const me = async (req: Request, res: Response) => {
  if (!req.user) return sendUnauthorized(res);
  return sendSuccess(res, 200, "Current user loaded successfully.", omitPassHash(req.user));
};

export const changePassword = async (req: ChangePasswordRequest, res: Response) => {
  try {
    if (!req.user) return sendUnauthorized(res);
    const result = await changeUserPassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    return sendSuccess(res, 200, "Password changed successfully.", result);
  } catch (error: any) {
    handleApiError(error, res);
  }
};
