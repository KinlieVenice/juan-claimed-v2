import type { Request } from "express";
import { z } from "zod";

// value is server-derived from englishName (see fieldOptions.service.ts) — not client
// input. fieldId isn't accepted in the body either: it comes from the URL
// (/fields/:fieldId/options) for both create and update.
export const fieldOptionSchema = z.object({
    englishName: z.string().min(1),
    tagalogName: z.string().min(1),
    englishDescription: z.string(),
    tagalogDescription: z.string(),
    sortOrder: z.number().int().optional(),
});

export const fieldOptionUpdateSchema = fieldOptionSchema.extend({
    id: z.string().min(1),
});

// Bulk — a field's options are always created/edited as a whole set in one call, not
// one at a time (see fieldOptions.service.ts).
export const createFieldOptionsSchema = z.object({
    options: z.array(fieldOptionSchema),
});

export const editFieldOptionsSchema = z.object({
    options: z.array(fieldOptionUpdateSchema),
});

export type CreateFieldOptionsDto = z.infer<typeof createFieldOptionsSchema>;
export type EditFieldOptionsDto = z.infer<typeof editFieldOptionsSchema>;

export type GetFieldOptionsRequest = Request<{ fieldId: string }>;
export type CreateFieldOptionsRequest = Request<{ fieldId: string }, {}, CreateFieldOptionsDto>;
export type EditFieldOptionsRequest = Request<{ fieldId: string }, {}, EditFieldOptionsDto>;
