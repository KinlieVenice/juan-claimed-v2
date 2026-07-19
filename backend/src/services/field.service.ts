import { prisma, Prisma } from "../../src/utils/prisma.js"
import type { CreateUpdateFieldDto } from "../requests/field.request.js";
import { toSnakeCaseKey } from "../utils/slug.util.js";

// A repeater subfield (parentFieldId set) can't itself be a REPEATER_GROUP —
// no nested repeater groups (same rule prisma/factories/benefitFieldFactory.ts enforces).
const assertNotNestedRepeaterGroup = async (parentFieldId: string | null | undefined, fieldInputTypeId: string) => {
  if (!parentFieldId) return;

  const inputType = await prisma.dimFieldInputType.findUnique({ where: { id: fieldInputTypeId } });
  if (inputType?.value === "REPEATER_GROUP") {
    console.error(`[FieldService] Rejected: a repeater subfield cannot itself be a REPEATER_GROUP.`);
    throw new Error("NESTED_REPEATER_GROUP_NOT_ALLOWED");
  }
};

// Repeater subfields can't have their own dynamic (visibility) rule group — a dynamic
// condition's "which row?" is ambiguous unless the caller row-scopes it, which isn't
// supported yet, so it's forbidden at the schema-authoring level for now.
const assertNoDynamicRuleGroupForSubfield = async (fieldId: string, parentFieldId: string | null | undefined) => {
  if (!parentFieldId) return;

  const existingDynamicRuleGroup = await prisma.fctDynamicRuleGroup.findFirst({ where: { fieldId } });
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

// ADD FIELD
export const addField = async (data: CreateUpdateFieldDto) => {
  const key = toSnakeCaseKey(data.englishName);

  const existingField = await prisma.dimField.findUnique({ where: { key } });

  if (existingField) {
    console.error(`[FieldService] Execution stopped: a field named "${data.englishName}" already exists (case/spacing-insensitive).`);
    throw new Error("DUPLICATE_KEY");
  }

  await assertNotNestedRepeaterGroup(data.parentFieldId, data.fieldInputTypeId);

  try {
    return await prisma.dimField.create({
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
        fieldHierarchyId: data.fieldHierarchyId || null,
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

// EDIT FIELD
export const editField = async (id: string, data: CreateUpdateFieldDto) => {
  const existingField = await prisma.dimField.findUnique({ where: { id } });
  
  if (!existingField) {
    console.error(`[FieldService] Update failed: Field with ID "${id}" does not exist.`);
    throw new Error("FIELD_NOT_FOUND");
  }

  await assertNotNestedRepeaterGroup(data.parentFieldId, data.fieldInputTypeId);
  await assertNoDynamicRuleGroupForSubfield(id, data.parentFieldId);

  const key = toSnakeCaseKey(data.englishName);

  const duplicateField = await prisma.dimField.findFirst({
    where: { id: { not: id }, key },
  });

  if (duplicateField) {
    console.error(`[FieldService] Update stopped: a field named "${data.englishName}" already exists (case/spacing-insensitive).`);
    throw new Error("DUPLICATE_KEY");
  }

  try {
    return await prisma.dimField.update({
      where: { id },
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
        fieldHierarchyId: data.fieldHierarchyId || null,
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

// REMOVE FIELD
export const removeField = async (id: string) => {
  const existingField = await prisma.dimField.findUnique({ where: { id } });
  
  if (!existingField) {
    console.error(`[FieldService] Deletion failed: Field with ID "${id}" does not exist.`);
    throw new Error("FIELD_NOT_FOUND");
  }

  return await prisma.dimField.delete({ where: { id } });
};