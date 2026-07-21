// Real — wraps GET/PUT /api/field-answers, POST /api/field-answers/groups,
// GET /api/field-answers/groups/:fieldId (backend/routes.md). Was mock-backed
// (@/mock/answers.mock, no fetch at all) — nothing submitted through the UI ever reached
// the real backend, so eligibility could never actually update from real answers; this is
// the fix for that gap.
import { apiFetch } from "@/lib/api";
import type { UserFieldAnswer, UserFieldAnswerGroup } from "@/types/domain";

export interface SubmitFieldAnswerInput {
  fieldId: string;
  value: unknown;
  repeaterGroupId?: string | null;
}

export async function getMyFieldAnswers(token?: string): Promise<UserFieldAnswer[]> {
  return apiFetch<UserFieldAnswer[]>("/api/field-answers", { token });
}

export async function submitFieldAnswers(items: SubmitFieldAnswerInput[], token?: string): Promise<UserFieldAnswer[]> {
  return apiFetch<UserFieldAnswer[]>("/api/field-answers", {
    method: "PUT",
    token,
    body: JSON.stringify({ answers: items }),
  });
}

export async function createAnswerGroup(fieldId: string, token?: string): Promise<UserFieldAnswerGroup> {
  return apiFetch<UserFieldAnswerGroup>("/api/field-answers/groups", {
    method: "POST",
    token,
    body: JSON.stringify({ fieldId }),
  });
}

export async function getMyAnswerGroups(fieldId: string, token?: string): Promise<UserFieldAnswerGroup[]> {
  return apiFetch<UserFieldAnswerGroup[]>(`/api/field-answers/groups/${fieldId}`, { token });
}

export async function deleteAnswerGroup(groupId: string, token?: string): Promise<void> {
  await apiFetch<null>(`/api/field-answers/groups/${groupId}`, { method: "DELETE", token });
}
