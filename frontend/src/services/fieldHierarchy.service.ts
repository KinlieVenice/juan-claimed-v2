// Real — wraps GET /api/field-hierarchies, GET /api/field-hierarchies/:id (backend/routes.md).
import { apiFetch } from "@/lib/api";
import type { DimFieldHierarchy } from "@/types/domain";

export async function getHierarchies(token: string | null | undefined): Promise<DimFieldHierarchy[]> {
  // No token = the "public/no account" flow (see fieldHierarchy.route.ts's "/public").
  const base = token ? "/api/field-hierarchies" : "/api/field-hierarchies/public";
  return apiFetch<DimFieldHierarchy[]>(base, { token: token ?? undefined });
}

export async function getHierarchyById(id: string, token: string): Promise<DimFieldHierarchy> {
  return apiFetch<DimFieldHierarchy>(`/api/field-hierarchies/${id}`, { token });
}
