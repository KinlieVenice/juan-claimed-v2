// Mirrors GET /api/fields/:fieldId/options (backend/docs/api-docs.md).
import { delay } from "@/lib/delay";
import { getFieldOptions as mockGetFieldOptions } from "@/mock/fields.mock";
import type { DimFieldOption } from "@/types/domain";

export async function getFieldOptions(fieldId: string): Promise<DimFieldOption[]> {
  await delay();
  return mockGetFieldOptions(fieldId);
}
