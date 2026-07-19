// Mirrors GET/PUT /api/field-answers, POST /api/field-answers/groups,
// GET /api/field-answers/groups/:fieldId (backend/docs/api-docs.md).
import { delay } from "@/lib/delay";
import {
  readAnswers,
  readAnswerGroups,
  writeAnswer,
  createAnswerGroupRecord,
} from "@/mock/answers.mock";
import type { UserFieldAnswer, UserFieldAnswerGroup } from "@/types/domain";

export interface SubmitFieldAnswerInput {
  fieldId: string;
  value: unknown;
  repeaterGroupId?: string | null;
}

export async function getMyFieldAnswers(): Promise<UserFieldAnswer[]> {
  await delay();
  return readAnswers();
}

export async function submitFieldAnswers(items: SubmitFieldAnswerInput[]): Promise<UserFieldAnswer[]> {
  await delay(400);
  for (const item of items) {
    writeAnswer(item.fieldId, item.value, item.repeaterGroupId ?? null);
  }
  return readAnswers();
}

export async function createAnswerGroup(fieldId: string): Promise<UserFieldAnswerGroup> {
  await delay(200);
  return createAnswerGroupRecord(fieldId);
}

export async function getMyAnswerGroups(fieldId: string): Promise<UserFieldAnswerGroup[]> {
  await delay();
  return readAnswerGroups()
    .filter((g) => g.fieldId === fieldId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
