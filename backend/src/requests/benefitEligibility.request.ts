import type { Request } from "express";
import { z } from "zod";

// The "public/no account" flow's answers never touch the DB (see
// frontend/src/lib/answers-store.tsx's guest branch) — they're POSTed inline with each
// eligibility check instead of resolved from FctUserFieldAnswer rows via a userId.
export const guestEligibilitySchema = z.object({
  answers: z.record(z.string(), z.unknown()).default({}),
  repeaterRows: z.record(z.string(), z.array(z.record(z.string(), z.unknown()))).optional(),
});

export type GuestEligibilityDto = z.infer<typeof guestEligibilitySchema>;
export type GuestEligibilityRequest = Request<{}, {}, GuestEligibilityDto>;
export type GuestBenefitEligibilityRequest = Request<{ id: string }, {}, GuestEligibilityDto>;
