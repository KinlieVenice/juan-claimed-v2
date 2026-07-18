import { prisma, Prisma } from "../../src/utils/prisma.js"
import type { CreateUpdateFieldDto } from "../requests/field.request.js";

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
  const existingField = await prisma.dimField.findUnique({
    where: { key: data.key }
  });
  
  if (existingField) {
    console.error(`[FieldService] Execution stopped: Field key "${data.key}" already exists.`);
    throw new Error("DUPLICATE_KEY");
  }

  try {
    return await prisma.dimField.create({
      data: {
        key: data.key,
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
        configJson: data.configJson === null ? Prisma.DbNull : data.configJson,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      console.error(`[FieldService] Creation failed: Invalid foreign key reference for field "${data.key}".`);
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

  try {
    return await prisma.dimField.update({
      where: { id },
      data: {
        key: data.key,
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
        configJson: data.configJson === null ? Prisma.DbNull : data.configJson,
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