// Normalizes a human-entered name into a case/whitespace/separator-insensitive
// snake_case key: lowercased, any run of non-alphanumeric characters collapsed to
// a single "_". E.g. "first_field" == "FIRST FIELD" == "FIRST   FIELD" == "first-Field".
//
// Note: this does NOT split bare camelCase with no separator at all (e.g. "FirstField"
// stays "firstfield", not "first_field") — splitting on capitalization alone can't be
// distinguished from stray mid-word capitalization (e.g. a typo like "FiEld") without
// a dictionary, so only explicit separators (spaces, hyphens, underscores, punctuation)
// get normalized.
export const toSnakeCaseKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
