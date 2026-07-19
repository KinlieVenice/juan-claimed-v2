import type { UserFieldAnswer, UserFieldAnswerGroup } from "@/types/domain";

// In-memory only — simulates FctUserFieldAnswer / FctUserFieldAnswerGroup for whichever
// mock identity is currently active. Pre-seeded with the `default: true` (eGovPH-synced)
// fields only, matching how a real logged-in USER would show up on first load; anonymous
// Guests start with an empty store and fill everything via /form.
let userFieldAnswers: UserFieldAnswer[] = [
  { id: "ans-1", fieldId: "fld-first-name", repeaterGroupId: null, value: "Juana" },
  { id: "ans-2", fieldId: "fld-last-name", repeaterGroupId: null, value: "Dela Cruz" },
  { id: "ans-3", fieldId: "fld-address", repeaterGroupId: null, value: "123 Mabini St., Salawag" },
  { id: "ans-4", fieldId: "fld-dob", repeaterGroupId: null, value: "1958-03-12" },
  { id: "ans-5", fieldId: "fld-citizen", repeaterGroupId: null, value: true },
  { id: "ans-6", fieldId: "fld-location", repeaterGroupId: null, value: "SALAWAG" },
];

let userFieldAnswerGroups: UserFieldAnswerGroup[] = [];
let nextId = 100;

export function resetAnswersStore() {
  userFieldAnswers = [];
  userFieldAnswerGroups = [];
}

export function readAnswers(): UserFieldAnswer[] {
  return userFieldAnswers;
}

export function readAnswerGroups(): UserFieldAnswerGroup[] {
  return userFieldAnswerGroups;
}

export function writeAnswer(fieldId: string, value: unknown, repeaterGroupId: string | null = null) {
  const existing = userFieldAnswers.find((a) => a.fieldId === fieldId && a.repeaterGroupId === repeaterGroupId);
  if (existing) {
    existing.value = value;
  } else {
    userFieldAnswers = [...userFieldAnswers, { id: `ans-${nextId++}`, fieldId, repeaterGroupId, value }];
  }
}

export function createAnswerGroupRecord(fieldId: string): UserFieldAnswerGroup {
  const sortOrder = userFieldAnswerGroups.filter((g) => g.fieldId === fieldId).length;
  const group: UserFieldAnswerGroup = { id: `grp-answer-${nextId++}`, fieldId, sortOrder };
  userFieldAnswerGroups = [...userFieldAnswerGroups, group];
  return group;
}
