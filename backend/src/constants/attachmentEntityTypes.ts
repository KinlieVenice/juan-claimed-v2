// FctAttachment.entityType is a plain string (the target table's name),
// no schema-level enum exists. Attachments hang off a benefit's requirement,
// utilization, or how-to-apply rows (per schema design), never the benefit directly.
export const ATTACHMENT_ENTITY_TYPES = {
  REQUIREMENT: "fct_benefit_requirement",
  UTILIZATION: "fct_benefit_utilization",
  HOW_TO_APPLY: "fct_benefit_how_to_apply",
} as const;

export type AttachmentParentType = keyof typeof ATTACHMENT_ENTITY_TYPES;
