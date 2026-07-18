import type { Request } from "express";
import { z } from "zod";

// Define what fields you expect from the user
export const createUpdateFieldSchema = z.object({
    key: z.string().min(1),
    englishName: z.string().min(1),
    tagalogName: z.string().min(1),
    description: z.string(),
    classification: z.enum(["GLOBAL", "FOLLOW_UP"]),
    default: z.boolean(),
    required: z.boolean(),
    sortOrder: z.number().int(),
    configJson: z.record(z.string(), z.unknown()).nullable(),
    fieldInputTypeId: z.string().min(1),
    parentFieldId: z.string().min(1).nullable(),
    fieldHierarchyId: z.string().min(1).nullable(),
});

export type CreateUpdateFieldDto = z.infer<typeof createUpdateFieldSchema>;

// Attach that structure directly to the Express Request
// Request(ReqParams, ResBody, ReqBody, ReqQuery) = < {}, {}, {}, {} >

export type CreateUpdateFieldRequest = Request<{ id: string }, {}, CreateUpdateFieldDto>;

export type DeleteFieldRequest = Request<{ id: string }>;
