import type { Request } from "express";
import { z } from "zod";
import { fieldOptionSchema, fieldOptionUpdateSchema } from "./fieldOption.request.js";
import { dynamicRuleTreeSchema } from "./fieldRuleGroup.request.js";

// Define what fields you expect from the user
export const createUpdateFieldSchema = z.object({
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

// A hierarchy created inline as part of this same field save (as opposed to
// field.fieldHierarchyId, which reuses an ALREADY-created hierarchy by id).
const hierarchyLevelSchema = z.object({
    level: z.number().int(),
    englishName: z.string().min(1),
    tagalogName: z.string().min(1),
    englishDescription: z.string(),
    tagalogDescription: z.string(),
});

const hierarchyNodeSchema: z.ZodType<unknown> = z.lazy(() =>
    z.object({
        englishName: z.string().min(1),
        tagalogName: z.string().min(1),
        englishDescription: z.string(),
        tagalogDescription: z.string(),
        sortOrder: z.number().int().optional(),
        children: z.array(hierarchyNodeSchema).optional(),
    }),
);

const inlineHierarchySchema = z.object({
    englishName: z.string().min(1),
    tagalogName: z.string().min(1),
    englishDescription: z.string(),
    tagalogDescription: z.string(),
    levels: z.array(hierarchyLevelSchema),
});

// The whole field bundle in one call: the field row itself plus its options,
// dynamic (visibility) condition tree, and hierarchy — reused as-is from each
// sub-service's own request schema, just wired together for one field at a time.
// fieldOptionUpdateSchema (has id) is tried first so items carrying an id are treated
// as edits to an existing option; everything else is a new option to create.
export const compositeFieldSchema = z.object({
    field: createUpdateFieldSchema,
    options: z.array(z.union([fieldOptionUpdateSchema, fieldOptionSchema])).optional(),
    dynamicCondition: dynamicRuleTreeSchema.optional(),
    hierarchy: inlineHierarchySchema.optional(),
    hierarchyNodes: z.array(hierarchyNodeSchema).optional(),
});

export type CompositeFieldDto = z.infer<typeof compositeFieldSchema>;

// Attach that structure directly to the Express Request
// Request(ReqParams, ResBody, ReqBody, ReqQuery) = < {}, {}, {}, {} >

export type CreateFieldRequest = Request<{}, {}, CompositeFieldDto>;
export type UpdateFieldRequest = Request<{ id: string }, {}, CompositeFieldDto>;
