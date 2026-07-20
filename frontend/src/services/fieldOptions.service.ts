// Real — wraps GET /api/fields/:fieldId/options (backend/routes.md).
import { apiFetch } from "@/lib/api";
import type { DimFieldOption } from "@/types/domain";

export async function getFieldOptions(fieldId: string, token: string): Promise<DimFieldOption[]> {
  return apiFetch<DimFieldOption[]>(`/api/fields/${fieldId}/options`, { token });
}
