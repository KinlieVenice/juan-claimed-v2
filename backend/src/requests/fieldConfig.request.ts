import { z } from "zod";

// Per-input-type configJson shapes. All keys optional — a field can always be saved
// with no config at all ({} or null). Validated at the SERVICE layer (field.service.ts),
// not here at the request layer, since picking the right schema needs a DB lookup to
// resolve fieldInputTypeId -> the seeded DimFieldInputType.value string.

const isValidRegex = (pattern: string) => {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
};

const textConfigSchema = z
  .object({
    minLength: z.number().int().nonnegative().optional(),
    maxLength: z.number().int().positive().optional(),
    regex: z.string().refine(isValidRegex, { message: "Not a valid regular expression." }).optional(),
    regexLabel: z.string().optional(),
    placeholder: z.string().optional(),
    /** Renders as a multi-line textarea instead of a single-line input. */
    isMultiLine: z.boolean().optional(),
  })
  .strict()
  .refine((v) => v.minLength === undefined || v.maxLength === undefined || v.minLength <= v.maxLength, {
    message: "minLength must be less than or equal to maxLength.",
  });

const numberConfigSchema = z
  .object({
    min: z.number().optional(),
    max: z.number().optional(),
    allowDecimals: z.boolean().optional(),
    allowNegative: z.boolean().optional(),
    placeholder: z.string().optional(),
  })
  .strict()
  .refine((v) => v.min === undefined || v.max === undefined || v.min <= v.max, { message: "min must be less than or equal to max." });

const moneyConfigSchema = z
  .object({
    min: z.number().nonnegative().optional(),
    max: z.number().optional(),
    currencySymbol: z.string().optional(),
  })
  .strict()
  .refine((v) => v.min === undefined || v.max === undefined || v.min <= v.max, { message: "min must be less than or equal to max." });

const dateConfigSchema = z
  .object({
    minDate: z.string().optional(),
    maxDate: z.string().optional(),
    allowFuture: z.boolean().optional(),
    allowPast: z.boolean().optional(),
    /** Whether applicants also pick a time-of-day, not just a calendar date. */
    allowTime: z.boolean().optional(),
  })
  .strict();

const durationConfigSchema = z
  .object({
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    allowedUnits: z.array(z.enum(["days", "weeks", "months", "years"])).optional(),
  })
  .strict();

const multiSelectConfigSchema = z
  .object({
    minSelections: z.number().int().nonnegative().optional(),
    maxSelections: z.number().int().positive().optional(),
  })
  .strict();

// BOOLEAN, SINGLE_SELECT, HIERARCHY_SELECT, REPEATER_GROUP: nothing to configure today.
const emptyConfigSchema = z.object({}).strict();

export const CONFIG_SCHEMAS_BY_INPUT_TYPE: Record<string, z.ZodTypeAny> = {
  TEXT: textConfigSchema,
  NUMBER: numberConfigSchema,
  MONEY: moneyConfigSchema,
  DATE: dateConfigSchema,
  DURATION: durationConfigSchema,
  MULTI_SELECT: multiSelectConfigSchema,
  BOOLEAN: emptyConfigSchema,
  SINGLE_SELECT: emptyConfigSchema,
  HIERARCHY_SELECT: emptyConfigSchema,
  REPEATER_GROUP: emptyConfigSchema,
};
