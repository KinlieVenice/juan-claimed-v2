// Real — wraps GET /api/fields/:fieldId/options (backend/routes.md).
import { apiFetch } from "@/lib/api";
import type { DimFieldOption } from "@/types/domain";

export async function getFieldOptions(fieldId: string, token: string | null | undefined): Promise<DimFieldOption[]> {
  // No token = the "public/no account" flow (see field.route.ts's "/public/:fieldId/options").
  const base = token ? `/api/fields/${fieldId}/options` : `/api/fields/public/${fieldId}/options`;
  return apiFetch<DimFieldOption[]>(base, { token: token ?? undefined });
}
