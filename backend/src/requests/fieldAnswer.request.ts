import type { Request } from "express";
import { z } from "zod";

// repeaterGroupId is required for a REPEATER_GROUP subfield's answer, and must be
// omitted for every other field — enforced in fieldAnswer.service.ts, not here, since it
// depends on the referenced field's own shape.
const submitFieldAnswerSchema = z.object({
    fieldId: z.string().min(1),
    value: z.unknown(),
    repeaterGroupId: z.string().min(1).nullable().optional(),
});

export const submitFieldAnswersSchema = z.object({
    answers: z.array(submitFieldAnswerSchema),
});

// fieldId here is the REPEATER_GROUP field itself (not a subfield) — creates a new
// row-instance to answer that repeater's subfields against.
export const createAnswerGroupSchema = z.object({
    fieldId: z.string().min(1),
});

export type SubmitFieldAnswersDto = z.infer<typeof submitFieldAnswersSchema>;
export type CreateAnswerGroupDto = z.infer<typeof createAnswerGroupSchema>;

export type SubmitFieldAnswersRequest = Request<{}, {}, SubmitFieldAnswersDto>;
export type GetFieldAnswersRequest = Request;
export type CreateAnswerGroupRequest = Request<{}, {}, CreateAnswerGroupDto>;
export type GetAnswerGroupsRequest = Request<{ fieldId: string }>;
