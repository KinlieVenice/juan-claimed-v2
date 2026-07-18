import { prisma } from "../../src/utils/prisma.js"
import type { CreateFieldDto } from "../requests/field.request.js";

export const fetchAllFields = async () => {
  try {
    const fields = await prisma.dimField.findMany({
      orderBy: {
        sortOrder: "asc",
      },
    });
    
    return { data: fields };
  } catch (error) {
    console.error("Error fetching fields from database:", error);
    throw new Error("Could not retrieve field data.");
  }
};

export const addField = async (data: CreateFieldDto) => {
    const fields = await prisma.dimField.create({
        data: {
            key: data.key,
            englishName: data.englishName,
            tagalogName: data.tagalogName,
            description: data.description,
            classification: data.classification,
            default: data.default,  
            required: data.required,
            sortOrder: data.sortOrder,
            configJson: data.configJson,
            fieldInputTypeId: data.fieldInputTypeId,
            parentFieldId: data.parentFieldId,
            fieldHierarchyId: data.fieldHierarchyId,
        },
    });
    return { data: fields };
};

export const editField = () => {};

export const removeField = () => {};

export const fetchFieldById = () => {};


async function test() {
try {
    const data = await fetchAllFields();
    console.log("✅ Query successful! Fields data:");
    console.dir(data, { depth: null, colors: true }); // Prints the full array beautifully
  } catch (err) {
    console.error("❌ Test script caught an error:", err);
  }
}

test();