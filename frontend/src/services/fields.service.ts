// Mirrors GET /api/fields, GET /api/field-input-types, GET /api/field-condition-operators
// (backend/docs/api-docs.md). Bodies are mock-only for now — swap for real fetch() calls
// when the backend is wired; call sites never change.
import { delay } from "@/lib/delay";
import {
  fields as mockFields,
  inputTypes as mockInputTypes,
  conditionOperators as mockConditionOperators,
  getFieldById as mockGetFieldById,
  getSubfields as mockGetSubfields,
  getConditionOperators as mockGetConditionOperators,
} from "@/mock/fields.mock";
import type { DimField, DimFieldConditionOperator, DimFieldInputType } from "@/types/domain";

export async function getFields(): Promise<DimField[]> {
  await delay();
  return mockFields;
}

export async function getFieldById(id: string): Promise<DimField | undefined> {
  await delay();
  return mockGetFieldById(id);
}

export async function getSubfields(parentFieldId: string): Promise<DimField[]> {
  await delay();
  return mockGetSubfields(parentFieldId);
}

export async function getFieldInputTypes(): Promise<DimFieldInputType[]> {
  await delay();
  return Object.values(mockInputTypes);
}

export async function getFieldConditionOperators(fieldInputTypeId?: string): Promise<DimFieldConditionOperator[]> {
  await delay();
  return fieldInputTypeId ? mockGetConditionOperators(fieldInputTypeId) : mockConditionOperators;
}
