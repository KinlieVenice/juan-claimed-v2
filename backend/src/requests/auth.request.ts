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
