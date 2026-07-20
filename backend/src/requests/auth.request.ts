import type { Request } from "express";
import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type LoginRequest = Request<{}, {}, LoginDto>;

export const googleLoginSchema = z.object({
  idToken: z.string().min(1),
});

export type GoogleLoginDto = z.infer<typeof googleLoginSchema>;
export type GoogleLoginRequest = Request<{}, {}, GoogleLoginDto>;

export const egovLoginSchema = z.object({
  exchangeCode: z.string().min(1),
});

export type EgovLoginDto = z.infer<typeof egovLoginSchema>;
export type EgovLoginRequest = Request<{}, {}, EgovLoginDto>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type ChangePasswordRequest = Request<{}, {}, ChangePasswordDto>;
