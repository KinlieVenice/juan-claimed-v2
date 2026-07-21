// Client-side mirror of backend/src/utils/condition.util.ts's assertAnswerMatchesFieldConfig
// — the answering side needs to catch these BEFORE submit (native input constraints +
// inline errors), not just find out from a 400 after the fact. Kept as a pure function, no
// component coupling, so FieldInput.tsx just calls it per input type.
export interface TextConfig {
  minLength?: number;
  maxLength?: number;
  regex?: string;
  regexLabel?: string;
}
export interface NumberConfig {
  min?: number;
  max?: number;
  allowDecimals?: boolean;
  allowNegative?: boolean;
}
export interface MoneyConfig {
  min?: number;
  max?: number;
}
export interface DateConfig {
  minDate?: string;
  maxDate?: string;
  allowFuture?: boolean;
  allowPast?: boolean;
}
export interface MultiSelectConfig {
  minSelections?: number;
  maxSelections?: number;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export function textError(config: TextConfig | null | undefined, value: string): string | undefined {
  if (!config || !value) return undefined;
  if (typeof config.minLength === "number" && value.length < config.minLength) return `Must be at least ${config.minLength} characters.`;
  if (typeof config.maxLength === "number" && value.length > config.maxLength) return `Must be at most ${config.maxLength} characters.`;
  if (config.regex) {
    try {
      if (!new RegExp(config.regex).test(value)) return config.regexLabel ?? "Doesn't match the required format.";
    } catch {
      // A malformed pattern is an authoring-time bug, never block an answer over it — same
      // stance as the backend's own assertAnswerMatchesFieldConfig.
    }
  }
  return undefined;
}

export function numberError(config: NumberConfig | null | undefined, value: number | null): string | undefined {
  if (!config || value === null || Number.isNaN(value)) return undefined;
  if (typeof config.min === "number" && value < config.min) return `Must be at least ${config.min}.`;
  if (typeof config.max === "number" && value > config.max) return `Must be at most ${config.max}.`;
  if (config.allowDecimals === false && !Number.isInteger(value)) return "Whole numbers only.";
  if (config.allowNegative === false && value < 0) return "Must not be negative.";
  return undefined;
}

export function moneyError(config: MoneyConfig | null | undefined, value: number | null): string | undefined {
  if (!config || value === null || Number.isNaN(value)) return undefined;
  if (typeof config.min === "number" && value < config.min) return `Must be at least ${config.min}.`;
  if (typeof config.max === "number" && value > config.max) return `Must be at most ${config.max}.`;
  return undefined;
}

export function dateError(config: DateConfig | null | undefined, value: string): string | undefined {
  if (!config || !value) return undefined;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return undefined;
  if (config.minDate && time < new Date(config.minDate).getTime()) return `Must be on or after ${config.minDate}.`;
  if (config.maxDate && time > new Date(config.maxDate).getTime()) return `Must be on or before ${config.maxDate}.`;
  const now = Date.now();
  if (config.allowFuture === false && time > now) return "Future dates aren't allowed.";
  if (config.allowPast === false && time < now) return "Past dates aren't allowed.";
  return undefined;
}

// min/max attrs for a native <input type="date"> — narrower of the two possible bounds
// (configured minDate/maxDate vs. an allowFuture/allowPast=false today cutoff).
export function dateNativeBounds(config: DateConfig | null | undefined): { min?: string; max?: string } {
  if (!config) return {};
  const min = config.allowPast === false ? todayIso() : config.minDate;
  const max = config.allowFuture === false ? todayIso() : config.maxDate;
  return { min, max };
}

export function multiSelectError(config: MultiSelectConfig | null | undefined, value: string[]): string | undefined {
  if (!config) return undefined;
  if (typeof config.minSelections === "number" && value.length < config.minSelections) return `Pick at least ${config.minSelections}.`;
  if (typeof config.maxSelections === "number" && value.length > config.maxSelections) return `Pick at most ${config.maxSelections}.`;
  return undefined;
}
