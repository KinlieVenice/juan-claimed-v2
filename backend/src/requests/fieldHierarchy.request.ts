import type { Request } from "express";
import { z } from "zod";

const hierarchyLevelSchema = z.object({
    level: z.number().int(),
    englishName: z.string().min(1),
    tagalogName: z.string().min(1),
    englishDescription: z.string(),
    tagalogDescription: z.string(),
});

const hierarchyLevelUpdateSchema = hierarchyLevelSchema.extend({
    id: z.string().min(1),
});

// Nested tree, since nodes are self-referential (parentNodeId) — mirrors
// fieldHierarchy.service.ts's HierarchyNodeInput.
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

// Edit only touches display fields on an existing node — flat, not a tree.
const hierarchyNodeUpdateSchema = z.object({
    id: z.string().min(1),
    englishName: z.string().min(1),
    tagalogName: z.string().min(1),
    englishDescription: z.string(),
    tagalogDescription: z.string(),
    sortOrder: z.number().int().optional(),
});

// CREATE HIERARCHY (bulk: hierarchy + levels + nodes across all 3 tables in one call)
export const createHierarchySchema = z.object({
    englishName: z.string().min(1),
    tagalogName: z.string().min(1),
    englishDescription: z.string(),
    tagalogDescription: z.string(),
    levels: z.array(hierarchyLevelSchema),
    nodes: z.array(hierarchyNodeSchema),
});

// Granular bulk — levels/nodes can also be created/edited on their own, given a
// hierarchy's id, without resubmitting the whole hierarchy.
export const createHierarchyLevelsSchema = z.object({ levels: z.array(hierarchyLevelSchema) });
export const editHierarchyLevelsSchema = z.object({ levels: z.array(hierarchyLevelUpdateSchema) });
export const createHierarchyNodesSchema = z.object({ nodes: z.array(hierarchyNodeSchema) });
export const editHierarchyNodesSchema = z.object({ nodes: z.array(hierarchyNodeUpdateSchema) });

export type CreateHierarchyDto = z.infer<typeof createHierarchySchema>;
export type CreateHierarchyLevelsDto = z.infer<typeof createHierarchyLevelsSchema>;
export type EditHierarchyLevelsDto = z.infer<typeof editHierarchyLevelsSchema>;
export type CreateHierarchyNodesDto = z.infer<typeof createHierarchyNodesSchema>;
export type EditHierarchyNodesDto = z.infer<typeof editHierarchyNodesSchema>;

export type GetHierarchyRequest = Request<{ id: string }>;
export type CreateHierarchyRequest = Request<{}, {}, CreateHierarchyDto>;
export type CreateHierarchyLevelsRequest = Request<{ id: string }, {}, CreateHierarchyLevelsDto>;
export type EditHierarchyLevelsRequest = Request<{ id: string }, {}, EditHierarchyLevelsDto>;
export type CreateHierarchyNodesRequest = Request<{ id: string }, {}, CreateHierarchyNodesDto>;
export type EditHierarchyNodesRequest = Request<{ id: string }, {}, EditHierarchyNodesDto>;
