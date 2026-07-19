import { randomUUID } from "node:crypto";

// Normalizes a human-entered name into a case/whitespace/separator-insensitive
// SCREAMING_SNAKE_CASE suffix (no uuid) — e.g. "FIRST_FIELD" == "FIRST FIELD" ==
// "FIRST   FIELD" == "first-Field".
//
// Note: this does NOT split bare camelCase with no separator at all (e.g. "FirstField"
// stays "FIRSTFIELD", not "FIRST_FIELD") — splitting on capitalization alone can't be
// distinguished from stray mid-word capitalization (e.g. a typo like "FiEld") without
// a dictionary, so only explicit separators (spaces, hyphens, underscores, punctuation)
// get normalized.
export const toSnakeCaseKey = (value: string): string =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

// Builds the actual key/value to store: a short random UUID segment + "_" + the
// normalized name, e.g. "A1B2C3D4_PWD". The uuid segment is what actually
// guarantees uniqueness (so two rows can never collide even before any duplicate
// check runs); the name suffix is just for human readability/debuggability.
// Call this ONLY at creation — the result is meant to be immutable afterward
// (see field.service.ts / fieldOptions.service.ts for why: value/key can get
// embedded in stored condition JSON and user answers, so it must never change
// out from under existing references once created).
export const generateUniqueCode = (value: string): string => {
  const shortId = randomUUID().split("-")[0]!.toUpperCase();
  return `${shortId}_${toSnakeCaseKey(value)}`;
};

// True if two names normalize to the same code — the "is this actually a duplicate
// name" check. Always compare against a row's CURRENT englishName column, never
// against a stored key/value's suffix — that suffix is frozen at creation time, so
// after a rename (e.g. "Tali" -> "Tall") it stops reflecting what the row is actually
// called, and a stale-suffix check would wrongly keep blocking a new field genuinely
// named "Tali" even though nothing is currently named that.
export const namesMatch = (a: string, b: string): boolean => toSnakeCaseKey(a) === toSnakeCaseKey(b);
