import { prisma, Prisma, type DbClient } from "../utils/prisma.js";
import type { CreateUpdateFieldDto } from "../requests/field.request.js";
import { generateUniqueCode, namesMatch } from "../utils/slug.util.js";
import {
  createFieldOptionsWith,
  editFieldOptionsWith,
  fetchFieldOptions,
  type FieldOptionInput,
  type FieldOptionUpdateInput,
} from "./fieldOptions.service.js";
import {
  createDynamicRuleGroupTreeWith,
  editDynamicRuleGroupTreeWith,
  fetchDynamicRuleGroupTree,
  type DynamicRuleTreeRoot,
} from "./fieldRuleGroup.service.js";
import {
  createHierarchyWith,
  type HierarchyLevelInput,
  type HierarchyNodeInput,
} from "./fieldHierarchy.service.js";

// The whole field bundle in one call, for exactly ONE field at a time (never bulk across
// many fields — creating/editing many fields at once isn't a real use case the way bulk
// options/levels/nodes are). Each sub-object reuses its own service's existing input
// shape as-is; this type just wires them together. `hierarchy` is for creating a BRAND
// NEW hierarchy inline as part of this save — to reuse an already-existing one, set
// `field.fieldHierarchyId` instead and omit `hierarchy`.
export interface CompositeFieldInput {
  field: CreateUpdateFieldDto;
  options?: (FieldOptionInput | FieldOptionUpdateInput)[];
  dynamicCondition?: DynamicRuleTreeRoot;
  hierarchy?: {
    englishName: string;
    tagalogName: string;
    englishDescription: string;
    tagalogDescription: string;
    levels: HierarchyLevelInput[];
  };
  hierarchyNodes?: HierarchyNodeInput[];
}

// Duplicate-name check compares against CURRENT englishName/tagalogName values, not a
// stored key's frozen suffix — see namesMatch's comment for why (a rename would otherwise
// leave a stale "this name is taken" block behind for a name nothing currently has). A
// collision in EITHER language blocks the save, not just English.
const findFieldByName = async (db: DbClient, englishName: string, tagalogName: string, excludeId?: string) => {
  const fields = await db.dimField.findMany({
    where: excludeId ? { id: { not: excludeId } } : {},
    select: { id: true, englishName: true, tagalogName: true },
  });
  return fields.find((field) => namesMatch(field.englishName, englishName) || namesMatch(field.tagalogName, tagalogName)) ?? null;
};

// A repeater subfield (parentFieldId set) can't itself be a REPEATER_GROUP —
// no nested repeater groups (same rule prisma/factories/benefitFieldFactory.ts enforces).
const assertNotNestedRepeaterGroup = async (db: DbClient, parentFieldId: string | null | undefined, fieldInputTypeId: string) => {
  if (!parentFieldId) return;

  const inputType = await db.dimFieldInputType.findUnique({ where: { id: fieldInputTypeId } });
  if (inputType?.value === "REPEATER_GROUP") {
    console.error(`[FieldService] Rejected: a repeater subfield cannot itself be a REPEATER_GROUP.`);
    throw new Error("NESTED_REPEATER_GROUP_NOT_ALLOWED");
  }
};

// Repeater subfields can't have their own dynamic (visibility) rule group — a dynamic
// condition's "which row?" is ambiguous unless the caller row-scopes it, which isn't
// supported yet, so it's forbidden at the schema-authoring level for now.
const assertNoDynamicRuleGroupForSubfield = async (db: DbClient, fieldId: string, parentFieldId: string | null | undefined) => {
  if (!parentFieldId) return;

  const existingDynamicRuleGroup = await db.fctDynamicRuleGroup.findFirst({ where: { fieldId } });
  if (existingDynamicRuleGroup) {
    console.error(`[FieldService] Rejected: field "${fieldId}" has a dynamic rule group and cannot become a repeater subfield.`);
    throw new Error("DYNAMIC_RULE_GROUP_NOT_ALLOWED_FOR_REPEATER_SUBFIELD");
  }
};

// FETCH ALL FIELDS
export const fetchAllFields = async () => {
  return await prisma.dimField.findMany({
    orderBy: {
      sortOrder: "asc",
    },
  });
};

// FETCH SINGLE FIELD BY ID
export const fetchFieldById = async (id: string) => {
  const field = await prisma.dimField.findUnique({ where: { id } });

  if (!field) {
    console.error(`[FieldService] Retrieval failed: Field with ID "${id}" does not exist.`);
    throw new Error("FIELD_NOT_FOUND");
  }

  return field;
};

// FETCH A FIELD TOGETHER WITH ITS OPTIONS AND DYNAMIC CONDITION TREE — the composite
// create/edit's response shape, mirroring the composite input shape.
const fetchCompositeField = async (fieldId: string) => {
  const [field, options, dynamicCondition] = await Promise.all([
    fetchFieldById(fieldId),
    fetchFieldOptions(fieldId),
    fetchDynamicRuleGroupTree(fieldId),
  ]);

  return { ...field, options, dynamicCondition };
};

// --- single-field logic, kept internal: creating/editing a field bundle is always for
// ONE field at a time (bulk applies to a field's OWN sub-resources — options, hierarchy
// levels/nodes, rule tree — not to fields themselves).

const createFieldRecordWith = async (db: DbClient, data: CreateUpdateFieldDto, fieldHierarchyId: string | null) => {
  const existingField = await findFieldByName(db, data.englishName, data.tagalogName);

  if (existingField) {
    console.error(`[FieldService] Execution stopped: a field named "${data.englishName}"/"${data.tagalogName}" already exists (case/spacing-insensitive).`);
    throw new Error("DUPLICATE_KEY");
  }

  await assertNotNestedRepeaterGroup(db, data.parentFieldId, data.fieldInputTypeId);

  const key = generateUniqueCode(data.englishName);

  try {
    return await db.dimField.create({
      data: {
        key,
        englishName: data.englishName,
        tagalogName: data.tagalogName,
        description: data.description,
        classification: data.classification,
        default: data.default,
        required: data.required,
        sortOrder: data.sortOrder,
        fieldInputTypeId: data.fieldInputTypeId,
        parentFieldId: data.parentFieldId || null,
        fieldHierarchyId,
        configJson: data.configJson === null ? Prisma.DbNull : (data.configJson as Prisma.InputJsonValue),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      console.error(`[FieldService] Creation failed: Invalid foreign key reference for field "${key}".`);
      throw new Error("INVALID_FOREIGN_KEY");
    }
    throw error;
  }
};

const updateFieldRecordWith = async (db: DbClient, id: string, data: CreateUpdateFieldDto, fieldHierarchyId: string | null) => {
  const existingField = await db.dimField.findUnique({ where: { id } });

  if (!existingField) {
    console.error(`[FieldService] Update failed: Field with ID "${id}" does not exist.`);
    throw new Error("FIELD_NOT_FOUND");
  }

  await assertNotNestedRepeaterGroup(db, data.parentFieldId, data.fieldInputTypeId);
  await assertNoDynamicRuleGroupForSubfield(db, id, data.parentFieldId);

  // key is intentionally NOT recomputed here — it's the stable identifier, set once at
  // creation. Recomputing it on every rename would silently orphan anything that already
  // references this field by key. englishName/tagalogName (display labels) can change
  // freely; we just make sure the new name doesn't collide with some OTHER field's name.
  const duplicateField = await findFieldByName(db, data.englishName, data.tagalogName, id);

  if (duplicateField) {
    console.error(`[FieldService] Update stopped: a field named "${data.englishName}"/"${data.tagalogName}" already exists (case/spacing-insensitive).`);
    throw new Error("DUPLICATE_KEY");
  }

  try {
    return await db.dimField.update({
      where: { id },
      data: {
        englishName: data.englishName,
        tagalogName: data.tagalogName,
        description: data.description,
        classification: data.classification,
        default: data.default,
        required: data.required,
        sortOrder: data.sortOrder,
        fieldInputTypeId: data.fieldInputTypeId,
        parentFieldId: data.parentFieldId || null,
        fieldHierarchyId,
        configJson: data.configJson === null ? Prisma.DbNull : (data.configJson as Prisma.InputJsonValue),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      console.error(`[FieldService] Update failed: Invalid foreign key reference for field "${id}".`);
      throw new Error("INVALID_FOREIGN_KEY");
    }
    throw error;
  }
};

// Splits a composite options array into creates (no id) vs edits (has id) — reuses
// fieldOptions.service.ts's own create/edit input types unchanged, per option.
const splitOptions = (options: (FieldOptionInput | FieldOptionUpdateInput)[]) => {
  const creates: FieldOptionInput[] = [];
  const edits: FieldOptionUpdateInput[] = [];

  for (const option of options) {
    if ("id" in option) edits.push(option);
    else creates.push(option);
  }

  return { creates, edits };
};

// ADD FIELD (composite: the field row + its options + dynamic condition tree + an
// optionally inline-created hierarchy, all in ONE transaction)
export const addField = async (data: CompositeFieldInput) => {
  const fieldId = await prisma.$transaction(async (tx) => {
    let fieldHierarchyId = data.field.fieldHierarchyId;

    if (data.hierarchy) {
      const hierarchy = await createHierarchyWith(tx, { ...data.hierarchy, nodes: data.hierarchyNodes ?? [] });
      fieldHierarchyId = hierarchy.id;
    }

    const field = await createFieldRecordWith(tx, data.field, fieldHierarchyId ?? null);

    if (data.options && data.options.length > 0) {
      const { creates, edits } = splitOptions(data.options);
      if (creates.length > 0) await createFieldOptionsWith(tx, field.id, creates);
      if (edits.length > 0) await editFieldOptionsWith(tx, field.id, edits);
    }

    if (data.dynamicCondition) {
      await createDynamicRuleGroupTreeWith(tx, field.id, data.dynamicCondition);
    }

    return field.id;
  });

  return await fetchCompositeField(fieldId);
};

// EDIT FIELD (composite: same bundle as addField, but for an existing field — the
// dynamic condition tree, if provided, wholesale-replaces the existing one; a `hierarchy`
// block always creates a NEW hierarchy and re-points this field at it)
export const editField = async (id: string, data: CompositeFieldInput) => {
  const fieldId = await prisma.$transaction(async (tx) => {
    let fieldHierarchyId = data.field.fieldHierarchyId;

    if (data.hierarchy) {
      const hierarchy = await createHierarchyWith(tx, { ...data.hierarchy, nodes: data.hierarchyNodes ?? [] });
      fieldHierarchyId = hierarchy.id;
    }

    const field = await updateFieldRecordWith(tx, id, data.field, fieldHierarchyId ?? null);

    if (data.options && data.options.length > 0) {
      const { creates, edits } = splitOptions(data.options);
      if (creates.length > 0) await createFieldOptionsWith(tx, field.id, creates);
      if (edits.length > 0) await editFieldOptionsWith(tx, field.id, edits);
    }

    if (data.dynamicCondition) {
      await editDynamicRuleGroupTreeWith(tx, field.id, data.dynamicCondition);
    }

    return field.id;
  });

  return await fetchCompositeField(fieldId);
};

// REMOVE FIELD
export const removeField = async (id: string) => {
  const existingField = await prisma.dimField.findUnique({ where: { id } });

  if (!existingField) {
    console.error(`[FieldService] Deletion failed: Field with ID "${id}" does not exist.`);
    throw new Error("FIELD_NOT_FOUND");
  }

  return await prisma.dimField.delete({ where: { id } });
};
