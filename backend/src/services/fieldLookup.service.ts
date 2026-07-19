import { prisma } from "../utils/prisma.js";

// Read-only lookups over the seeded DimFieldInputType/DimFieldConditionOperator tables —
// never writes to them (see fieldConfigSeeder.ts, the only place allowed to touch these
// rows). Exists so the frontend has somewhere to fetch the option lists it needs to build
// a "create field" form (fieldInputTypeId) and a dynamic condition tree editor
// (fieldConditionOperatorId, scoped to the field's own input type).

// FETCH ALL FIELD INPUT TYPES
export const fetchAllFieldInputTypes = async () => {
  return await prisma.dimFieldInputType.findMany({ orderBy: { englishName: "asc" } });
};

// FETCH FIELD CONDITION OPERATORS — optionally scoped to one input type
export const fetchFieldConditionOperators = async (fieldInputTypeId?: string) => {
  return await prisma.dimFieldConditionOperator.findMany({
    where: fieldInputTypeId ? { fieldInputTypeId } : {},
    orderBy: { englishName: "asc" },
  });
};
