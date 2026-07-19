// FctAttachment.entityType is a plain string (the target table's name),
// no schema-level enum exists. Attachments hang off a benefit's requirement
// or utilization rows (per schema design), never the benefit directly.
export const ATTACHMENT_ENTITY_TYPES = {
  REQUIREMENT: "fct_benefit_requirement",
  UTILIZATION: "fct_benefit_utilization",
} as const;

export type AttachmentParentType = keyof typeof ATTACHMENT_ENTITY_TYPES;
