// FctAttachment.entityType is a plain string (the target table's name),
// no schema-level enum exists. Centralize the values used here to avoid
// magic-string typos and give a place to add more entity types later.
export const ATTACHMENT_ENTITY_TYPES = {
  BENEFIT: "fct_benefit",
} as const;
