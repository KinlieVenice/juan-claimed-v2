// Single source of truth for "is this eGovField-flagged field locked (read-only) for the
// current session" — FieldInput.tsx's disabled state AND every "don't submit a locked
// field's value" filter (ProfilePage/FormPage/AnswerMorePage/BenefitDetailsPage) both need
// the exact same answer, so this lives in exactly one place. Before this existed, each of
// those submit-filters had its own hardcoded `!f.eGovField` check that never learned about
// VITE_UNLOCK_GOOGLE_SYNCED_FIELDS — FieldInput.tsx would let a Google-only session type
// into an unlocked field, but the submit filter silently dropped that field's value anyway,
// so "edit profile, save" appeared to do nothing for exactly the fields this flag unlocks.
import type { DimField } from "@/types/domain";
import type { Role, AppUser } from "@/lib/auth";

export function isEgovFieldLocked(field: Pick<DimField, "eGovField">, role: Role, user: Pick<AppUser, "googleId" | "egovId"> | null): boolean {
  if (!field.eGovField || role === "GUEST") return false;

  // VITE_UNLOCK_GOOGLE_SYNCED_FIELDS is a testing/demo escape hatch: Google is only ever a
  // MOCK stand-in for eGov's real identity data (see demoPersonaFactory.ts). A real
  // eGov-authenticated session (egovId set) always stays locked regardless of this flag.
  const isGoogleOnlyIdentity = !!user?.googleId && !user?.egovId;
  const googleFieldsUnlocked = import.meta.env.VITE_UNLOCK_GOOGLE_SYNCED_FIELDS === "true";
  if (isGoogleOnlyIdentity && googleFieldsUnlocked) return false;

  return true;
}
