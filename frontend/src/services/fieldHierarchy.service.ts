// Mirrors GET /api/field-hierarchies, GET /api/field-hierarchies/:id (backend/docs/api-docs.md).
import { delay } from "@/lib/delay";
import { hierarchies } from "@/mock/fields.mock";
import type { DimFieldHierarchy } from "@/types/domain";

export async function getHierarchies(): Promise<DimFieldHierarchy[]> {
  await delay();
  return hierarchies;
}

export async function getHierarchyById(id: string): Promise<DimFieldHierarchy | undefined> {
  await delay();
  return hierarchies.find((h) => h.id === id);
}
