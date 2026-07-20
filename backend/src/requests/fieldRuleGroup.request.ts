import type { Request } from "express";
import { z } from "zod";

const dynamicRuleTreeNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.object({
      kind: z.literal("group"),
      logicalOperator: z.enum(["ALL", "ANY"]),
      children: z.array(dynamicRuleTreeNodeSchema),
    }),
    z.object({
      kind: z.literal("condition"),
      fieldConditionOperatorId: z.string().min(1),
      conditionFieldValue: z.unknown(),
      // Which field's answer this leaf evaluates. Omitted/null = self-referential —
      // the enclosing tree's own field (today's only behavior).
      conditionFieldId: z.string().uuid().nullish(),
    }),
  ]),
);

// The whole AND/OR tree, submitted in one shot — root must be a group.
export const dynamicRuleTreeSchema = z.object({
  kind: z.literal("group"),
  logicalOperator: z.enum(["ALL", "ANY"]),
  children: z.array(dynamicRuleTreeNodeSchema),
});

export type DynamicRuleTreeDto = z.infer<typeof dynamicRuleTreeSchema>;

export type GetDynamicRuleGroupTreeRequest = Request<{ fieldId: string }>;
export type SaveDynamicRuleGroupTreeRequest = Request<{ fieldId: string }, {}, DynamicRuleTreeDto>;
