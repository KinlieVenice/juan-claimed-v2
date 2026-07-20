import type { Request } from "express";
import { z } from "zod";
import { fieldOptionSchema, fieldOptionUpdateSchema } from "./fieldOption.request.js";
import { dynamicRuleTreeSchema } from "./fieldRuleGroup.request.js";

// Define what fields you expect from the user
export const createUpdateFieldSchema = z.object({
    englishName: z.string().min(1),
    tagalogName: z.string().min(1),
    englishDescription: z.string(),
    tagalogDescription: z.string(),
    classification: z.enum(["GLOBAL", "FOLLOW_UP"]),
    default: z.boolean(),
    required: z.boolean(),
    // True = still answerable like any other field, but excluded from the field pickers
    // used to build a benefit's eligibility rule tree (or another field's show/hide
    // condition) — e.g. free-text name/address fields that aren't real comparators.
    notConditional: z.boolean().optional(),
    // "Anchor to" — must be one of the fields THIS field's own dynamicCondition actually
    // references (a "Parent Dependent"); enforced in field.service.ts's
    // assertAnchorFieldValid, not here (needs the sibling dynamicCondition to check
    // against). Renders this field pinned under anchorFieldId instead of at its own flat
    // sortOrder — see DimField.anchorFieldId in schema.prisma.
    anchorFieldId: z.string().min(1).nullable().optional(),
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

// A REPEATER_GROUP field's row-level children (e.g. "Dependent's Date of Birth" under
// "Dependents"), created/edited in bulk alongside the parent. No classification (inherits
// the parent's) and no parentFieldId (the parent's own id, set server-side) — everything
// else mirrors createUpdateFieldSchema. `id` present = edit an existing subfield; absent =
// create a new one. Omitted from the submitted array entirely = left untouched (deleting a
// subfield goes through the existing DELETE /api/fields/:id, same as any other field).
const subfieldSchema = z.object({
    id: z.string().min(1).optional(),
    englishName: z.string().min(1),
    tagalogName: z.string().min(1),
    englishDescription: z.string(),
    tagalogDescription: z.string(),
    required: z.boolean(),
    sortOrder: z.number().int(),
    configJson: z.record(z.string(), z.unknown()).nullable(),
    fieldInputTypeId: z.string().min(1),
    fieldHierarchyId: z.string().min(1).nullable(),
    options: z.array(z.union([fieldOptionUpdateSchema, fieldOptionSchema])).optional(),
});

export type SubfieldDto = z.infer<typeof subfieldSchema>;

// "Children Dependents" — the parent-authored shortcut for creating an anchored
// conditional child in one step (see field.service.ts's createOrUpdateAnchoredChildrenWith).
// Same field-definition shape as subfieldSchema, plus the trigger (operator + value against
// THIS field, the one being saved) that gets turned into the child's own dynamicCondition
// server-side. Unlike subfields, a child keeps its own classification (inherited from the
// parent, same rule) but is NOT parentFieldId-scoped — it's a normal top-level field,
// anchorFieldId-pinned instead.
const anchoredChildSchema = z.object({
    id: z.string().min(1).optional(),
    englishName: z.string().min(1),
    tagalogName: z.string().min(1),
    englishDescription: z.string(),
    tagalogDescription: z.string(),
    required: z.boolean(),
    sortOrder: z.number().int(),
    configJson: z.record(z.string(), z.unknown()).nullable(),
    fieldInputTypeId: z.string().min(1),
    fieldHierarchyId: z.string().min(1).nullable(),
    options: z.array(z.union([fieldOptionUpdateSchema, fieldOptionSchema])).optional(),
    triggerOperatorId: z.string().min(1),
    triggerValue: z.unknown(),
});

export type AnchoredChildDto = z.infer<typeof anchoredChildSchema>;

// The whole field bundle in one call: the field row itself plus its options,
// dynamic (visibility) condition tree, hierarchy, (REPEATER_GROUP only) subfields, and
// (Children Dependents) anchoredChildren — reused as-is from each sub-service's own request
// schema, just wired together for one field at a time. fieldOptionUpdateSchema (has id) is
// tried first so items carrying an id are treated as edits to an existing option; everything
// else is a new option to create.
export const compositeFieldSchema = z.object({
    field: createUpdateFieldSchema,
    options: z.array(z.union([fieldOptionUpdateSchema, fieldOptionSchema])).optional(),
    dynamicCondition: dynamicRuleTreeSchema.optional(),
    hierarchy: inlineHierarchySchema.optional(),
    hierarchyNodes: z.array(hierarchyNodeSchema).optional(),
    subfields: z.array(subfieldSchema).optional(),
    anchoredChildren: z.array(anchoredChildSchema).optional(),
});

export type CompositeFieldDto = z.infer<typeof compositeFieldSchema>;

// Attach that structure directly to the Express Request
// Request(ReqParams, ResBody, ReqBody, ReqQuery) = < {}, {}, {}, {} >

export type CreateFieldRequest = Request<{}, {}, CompositeFieldDto>;
export type UpdateFieldRequest = Request<{ id: string }, {}, CompositeFieldDto>;

// Bulk sortOrder resequencing, scoped to one classification at a time — Global and
// Follow-Up each have their own independent sort sequence despite sortOrder being a flat
// column on DimField.
export const reorderFieldsSchema = z.object({
    classification: z.enum(["GLOBAL", "FOLLOW_UP"]),
    orderedIds: z.array(z.string().min(1)).min(1),
});

export type ReorderFieldsDto = z.infer<typeof reorderFieldsSchema>;
export type ReorderFieldsRequest = Request<{}, {}, ReorderFieldsDto>;
