import { prisma, type DbClient } from "../utils/prisma.js";
import dayjs from "../utils/dayjs.util.js";

// field_value is a single VarChar(255); compound shapes are JSON-encoded into it on
// write and parsed back out on read/evaluation. See docs/condition-value-shapes.md for
// the actualValue shape compare() expects per inputType — this is the storage-side
// counterpart of that reference.
const MAX_VALUE_LENGTH = 255;

type AnswerableField = {
  id: string;
  parentFieldId: string | null;
  fieldHierarchyId: string | null;
  fieldInputType: { value: string };
};

export interface SubmitFieldAnswerInput {
  fieldId: string;
  value: unknown;
  repeaterGroupId?: string | null | undefined;
}

const assertLength = (encoded: string, fieldId: string): string => {
  if (encoded.length > MAX_VALUE_LENGTH) {
    console.error(`[FieldAnswerService] Encoded value for field "${fieldId}" exceeds ${MAX_VALUE_LENGTH} characters.`);
    throw new Error("INVALID_ANSWER_VALUE");
  }
  return encoded;
};

const isDurationShape = (value: unknown): value is { value: number; unit: string } =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { value?: unknown }).value === "number" &&
  ["days", "weeks", "months", "years"].includes((value as { unit?: unknown }).unit as string);

// Validates a raw client-submitted value against the field's inputType (and, for
// SELECT/HIERARCHY_SELECT, against that field's own configured options/nodes) and
// stringifies it into the VarChar(255). Throws INVALID_ANSWER_VALUE on any mismatch —
// same "reject, don't coerce" stance condition.util.ts's compare() takes.
const encodeFieldValue = async (db: DbClient, field: AnswerableField, rawValue: unknown): Promise<string> => {
  switch (field.fieldInputType.value) {
    case "TEXT": {
      if (typeof rawValue !== "string") throw new Error("INVALID_ANSWER_VALUE");
      return assertLength(rawValue, field.id);
    }
    case "NUMBER":
    case "MONEY": {
      if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) throw new Error("INVALID_ANSWER_VALUE");
      return assertLength(String(rawValue), field.id);
    }
    case "BOOLEAN": {
      if (typeof rawValue !== "boolean") throw new Error("INVALID_ANSWER_VALUE");
      return rawValue ? "true" : "false";
    }
    case "DATE": {
      if (typeof rawValue !== "string" || !dayjs(rawValue).isValid()) throw new Error("INVALID_ANSWER_VALUE");
      return assertLength(rawValue, field.id);
    }
    case "DURATION": {
      if (!isDurationShape(rawValue)) throw new Error("INVALID_ANSWER_VALUE");
      return assertLength(JSON.stringify(rawValue), field.id);
    }
    case "SINGLE_SELECT": {
      if (typeof rawValue !== "string") throw new Error("INVALID_ANSWER_VALUE");
      const option = await db.dimFieldOption.findFirst({ where: { fieldId: field.id, value: rawValue } });
      if (!option) throw new Error("INVALID_ANSWER_VALUE");
      return assertLength(rawValue, field.id);
    }
    case "MULTI_SELECT": {
      if (!Array.isArray(rawValue) || rawValue.some((v) => typeof v !== "string")) throw new Error("INVALID_ANSWER_VALUE");
      const values = rawValue as string[];
      const options = await db.dimFieldOption.findMany({ where: { fieldId: field.id, value: { in: values } } });
      if (options.length !== new Set(values).size) throw new Error("INVALID_ANSWER_VALUE");
      return assertLength(JSON.stringify(values), field.id);
    }
    case "HIERARCHY_SELECT": {
      if (typeof rawValue !== "string" || !field.fieldHierarchyId) throw new Error("INVALID_ANSWER_VALUE");
      const node = await db.dimFieldHierarchyNode.findFirst({ where: { fieldHierarchyId: field.fieldHierarchyId, value: rawValue } });
      if (!node) throw new Error("INVALID_ANSWER_VALUE");
      return assertLength(rawValue, field.id);
    }
    case "REPEATER_GROUP":
      console.error(`[FieldAnswerService] Field "${field.id}" is a REPEATER_GROUP and has no scalar answer of its own.`);
      throw new Error("FIELD_NOT_ANSWERABLE");
    default:
      throw new Error("UNSUPPORTED_INPUT_TYPE");
  }
};

// Walks parentNodeId in memory to build a HIERARCHY_SELECT node's root-first ancestor
// path (e.g. ["NCR", "Manila", "Ermita"]) — the shape BELONGS_TO needs.
const resolveHierarchyAncestorPath = async (db: DbClient, fieldHierarchyId: string, nodeValue: string): Promise<string[]> => {
  const nodes = await db.dimFieldHierarchyNode.findMany({ where: { fieldHierarchyId } });
  const byId = new Map(nodes.map((node) => [node.id, node]));

  const selected = nodes.find((node) => node.value === nodeValue);
  if (!selected) return [];

  const path: string[] = [];
  let current: (typeof nodes)[number] | undefined = selected;
  while (current) {
    path.unshift(current.value);
    current = current.parentNodeId ? byId.get(current.parentNodeId) : undefined;
  }
  return path;
};

// Inverse of encodeFieldValue. `forEvaluation` controls HIERARCHY_SELECT's shape:
// BELONGS_TO (the realistic PSGC-location use case) needs the ancestor-path array, not
// the plain node value — see the design note in docs/condition-value-shapes.md. This is
// a known, pre-existing limitation of the flat answers-map the evaluator expects (not
// something this change fixes): EQUALS/NOT_EQUALS/IN against a HIERARCHY_SELECT field
// resolved through this map won't evaluate correctly, only BELONGS_TO will.
const decodeFieldValue = async (
  db: DbClient,
  field: AnswerableField,
  storedValue: string | null,
  opts: { forEvaluation?: boolean } = {},
): Promise<unknown> => {
  if (storedValue === null) return null;

  switch (field.fieldInputType.value) {
    case "NUMBER":
    case "MONEY":
      return Number(storedValue);
    case "BOOLEAN":
      return storedValue === "true";
    case "DURATION":
    case "MULTI_SELECT":
      return JSON.parse(storedValue);
    case "HIERARCHY_SELECT":
      if (opts.forEvaluation && field.fieldHierarchyId) {
        return await resolveHierarchyAncestorPath(db, field.fieldHierarchyId, storedValue);
      }
      return storedValue;
    default:
      return storedValue;
  }
};

// Builds the fieldId -> actualValue map that services/ruleGroup.service.ts's
// evaluateBenefitEligibility(benefitId, answers) needs — each of its leaves resolves a
// (possibly different) field via its own wrapped dynamic rule group, so this map has to
// cover every field the caller might check, not just one. Scoped to a user's current
// NON-repeater answers (a REPEATER_GROUP field's data lives per-row, per-subfield —
// building the Array<Record<fieldId,value>> shape a REPEATER_GROUP condition needs is
// the caller's job; see docs/condition-value-shapes.md).
//
// NOTE: there is currently no mechanism in this codebase for one field to gate another
// field's visibility (a field's own FctDynamicRuleGroup tree can only check that SAME
// field's own answer — see fieldRuleGroup.service.ts; verified against live data, where
// every existing dynamic rule group turned out to be a benefit-eligibility threshold, not
// a visibility condition). So submitting/answering a field here is never gated on
// visibility — this map exists purely for whoever evaluates benefit eligibility.
export const resolveAnswersMapWith = async (db: DbClient, userId: string): Promise<Record<string, unknown>> => {
  const answers = await db.fctUserFieldAnswer.findMany({
    where: { userId, repeaterGroupId: null },
    include: { field: { include: { fieldInputType: true } } },
  });

  const map: Record<string, unknown> = {};
  for (const answer of answers) {
    map[answer.fieldId] = await decodeFieldValue(db, answer.field, answer.field_value, { forEvaluation: true });
  }
  return map;
};

export const resolveAnswersMap = async (userId: string): Promise<Record<string, unknown>> => {
  return await resolveAnswersMapWith(prisma, userId);
};

const submitOneFieldAnswer = async (db: DbClient, userId: string, input: SubmitFieldAnswerInput): Promise<void> => {
  const field = await db.dimField.findUnique({
    where: { id: input.fieldId },
    include: { fieldInputType: true },
  });

  if (!field) {
    console.error(`[FieldAnswerService] Field "${input.fieldId}" does not exist.`);
    throw new Error("FIELD_NOT_FOUND");
  }

  if (field.fieldInputType.value === "REPEATER_GROUP") {
    console.error(`[FieldAnswerService] Field "${field.id}" is a REPEATER_GROUP and has no scalar answer of its own.`);
    throw new Error("FIELD_NOT_ANSWERABLE");
  }

  const isRepeaterSubfield = field.parentFieldId !== null;
  const repeaterGroupId = input.repeaterGroupId ?? null;

  if (isRepeaterSubfield) {
    if (!repeaterGroupId) {
      console.error(`[FieldAnswerService] Field "${field.id}" is a repeater subfield and requires a repeaterGroupId.`);
      throw new Error("ANSWER_GROUP_REQUIRED");
    }

    const group = await db.fctUserFieldAnswerGroup.findUnique({ where: { id: repeaterGroupId } });
    if (!group || group.userId !== userId) {
      console.error(`[FieldAnswerService] Answer group "${repeaterGroupId}" does not exist for user "${userId}".`);
      throw new Error("ANSWER_GROUP_NOT_FOUND");
    }
    if (group.fieldId !== field.parentFieldId) {
      console.error(`[FieldAnswerService] Answer group "${repeaterGroupId}" does not belong to field "${field.id}"'s repeater.`);
      throw new Error("ANSWER_GROUP_FIELD_MISMATCH");
    }
  } else if (repeaterGroupId) {
    console.error(`[FieldAnswerService] Field "${field.id}" is not a repeater subfield and cannot take a repeaterGroupId.`);
    throw new Error("ANSWER_GROUP_NOT_ALLOWED");
  }

  const encodedValue = await encodeFieldValue(db, field, input.value);

  const existing = await db.fctUserFieldAnswer.findFirst({
    where: { userId, fieldId: field.id, repeaterGroupId },
  });

  if (existing) {
    await db.fctUserFieldAnswer.update({
      where: { id: existing.id },
      data: { field_value: encodedValue, updatedById: userId },
    });
  } else {
    await db.fctUserFieldAnswer.create({
      data: { userId, fieldId: field.id, repeaterGroupId, field_value: encodedValue, createdById: userId },
    });
  }
};

// SUBMIT FIELD ANSWERS (bulk upsert) — "With" variant processes items SEQUENTIALLY (not
// Promise.all): each item does its own find-then-create-or-update, so running them
// concurrently could race and create duplicate rows for the same (user, field).
export const submitFieldAnswersWith = async (db: DbClient, userId: string, items: SubmitFieldAnswerInput[]): Promise<void> => {
  for (const item of items) {
    await submitOneFieldAnswer(db, userId, item);
  }
};

export const submitFieldAnswers = async (userId: string, items: SubmitFieldAnswerInput[]) => {
  await prisma.$transaction((tx) => submitFieldAnswersWith(tx, userId, items));
  return await fetchUserFieldAnswers(userId);
};

// FETCH ALL OF A USER'S CURRENT ANSWERS, decoded for display (flat list — a client
// reconstructs repeater rows via fetchAnswerGroups + each answer's repeaterGroupId).
export const fetchUserFieldAnswers = async (userId: string) => {
  const answers = await prisma.fctUserFieldAnswer.findMany({
    where: { userId },
    include: { field: { include: { fieldInputType: true } } },
    orderBy: { createdAt: "asc" },
  });

  return await Promise.all(
    answers.map(async (answer) => ({
      id: answer.id,
      fieldId: answer.fieldId,
      repeaterGroupId: answer.repeaterGroupId,
      value: await decodeFieldValue(prisma, answer.field, answer.field_value),
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt,
    })),
  );
};

const assertRepeaterFieldWith = async (db: DbClient, fieldId: string) => {
  const field = await db.dimField.findUnique({ where: { id: fieldId }, include: { fieldInputType: true } });

  if (!field) {
    console.error(`[FieldAnswerService] Field "${fieldId}" does not exist.`);
    throw new Error("FIELD_NOT_FOUND");
  }

  if (field.fieldInputType.value !== "REPEATER_GROUP" || field.parentFieldId !== null) {
    console.error(`[FieldAnswerService] Field "${fieldId}" is not a top-level REPEATER_GROUP field.`);
    throw new Error("REPEATER_GROUP_REQUIRED");
  }

  return field;
};

// CREATE ANSWER GROUP — a new row-instance ("row") of a repeater field for this user
// (e.g. adding another dependent).
export const createAnswerGroup = async (userId: string, repeaterFieldId: string) => {
  return await prisma.$transaction(async (tx) => {
    await assertRepeaterFieldWith(tx, repeaterFieldId);

    const lastGroup = await tx.fctUserFieldAnswerGroup.findFirst({
      where: { userId, fieldId: repeaterFieldId },
      orderBy: { sortOrder: "desc" },
    });

    return await tx.fctUserFieldAnswerGroup.create({
      data: {
        userId,
        fieldId: repeaterFieldId,
        sortOrder: (lastGroup?.sortOrder ?? -1) + 1,
        createdById: userId,
      },
    });
  });
};

// FETCH ANSWER GROUPS — a user's row-instances for one repeater field, ordered.
export const fetchAnswerGroups = async (userId: string, repeaterFieldId: string) => {
  return await prisma.fctUserFieldAnswerGroup.findMany({
    where: { userId, fieldId: repeaterFieldId },
    orderBy: { sortOrder: "asc" },
  });
};
