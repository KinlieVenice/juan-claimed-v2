import type { Request } from "express";
import { z } from "zod";

export const translateSchema = z.object({
  prompt: z.string().min(1),
  sourceLang: z.string().min(1).default("en"),
  targetLang: z.string().min(1).default("fil"),
});

export type TranslateDto = z.infer<typeof translateSchema>;

export type TranslateRequest = Request<{}, {}, TranslateDto>;
