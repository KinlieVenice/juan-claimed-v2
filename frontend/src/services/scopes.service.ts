// Real — wraps GET /api/scopes (backend/routes.md). Fixed seeded set, no CRUD.
import { apiFetch } from "@/lib/api";

export interface Scope {
  id: string;
  name: string;
  value: "SUPERADMIN" | "NATIONAL" | "REGIONS" | "PROVINCES" | "DISTRICTS" | "CITIES-MUNICIPALITIES" | "BARANGAYS";
}

export async function getScopes(token: string): Promise<Scope[]> {
  return apiFetch<Scope[]>("/api/scopes", { token });
}
