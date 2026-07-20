// Real — wraps GET /api/field-hierarchies, GET /api/field-hierarchies/:id (backend/routes.md).
import { apiFetch } from "@/lib/api";
import type { DimFieldHierarchy } from "@/types/domain";

export async function getHierarchies(token: string): Promise<DimFieldHierarchy[]> {
  return apiFetch<DimFieldHierarchy[]>("/api/field-hierarchies", { token });
}

export async function getHierarchyById(id: string, token: string): Promise<DimFieldHierarchy> {
  return apiFetch<DimFieldHierarchy>(`/api/field-hierarchies/${id}`, { token });
}
