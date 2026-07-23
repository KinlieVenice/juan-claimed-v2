import { prisma } from "../utils/prisma.js";
import { submitFieldAnswers, createAnswerGroup, fetchAnswerGroups, type SubmitFieldAnswerInput } from "./fieldAnswer.service.js";
import type { EgovProfile } from "./egovApi.service.js";

// Backend port of frontend/src/lib/egov-profile-map.ts's mapping table (same englishName
// keys, same transforms — kept in sync by hand). The frontend version only ever built a
// DISPLAY-only `values` map for pre-filling the form; nothing was ever actually submitted,
// so an eGov-logged-in user had zero real FctUserFieldAnswer rows and every benefit
// eligibility check saw them as PENDING regardless of what their eGov profile said. This
// version calls the real submitFieldAnswers (the exact same upsert a manual form submit
// uses — find-then-update-or-create per (user, field), never a duplicate insert), so a
// fresh eGov SSO login counts toward eligibility immediately.
//
// Runs on EVERY successful eGov login (see auth.service.ts's loginWithEgov), not just first
// account creation — eGov is the live source of truth and the profile can change between
// sessions, and re-running this is always safe (upsert, not insert).
//
// Each field is submitted in its OWN try/catch (not one big batch) — submitFieldAnswers
// wraps its batch in a single transaction, so one field failing validation (e.g. a stray
// eGov value that doesn't match any seeded SINGLE_SELECT option) would otherwise roll back
// every other field in the same call, including Date of Birth/Residence — the ones benefit
// eligibility actually depends on.

const stripEgovPsgcCode = (code: string | null | undefined): string | null => (code ? code.slice(0, 2) + code.slice(3) : null);

const asString = (value: unknown): string | null => (value === null || value === undefined || value === "" ? null : String(value));

const asNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

// Gender's seeded options keep the normal toSnakeCaseKey("Male") -> "MALE" convention —
// eGov sends lowercase "male"/"female", so this converts on read, same as the frontend mapper.
const asUppercaseString = (value: unknown): string | null => {
  const s = asString(value);
  return s ? s.toUpperCase() : null;
};

const SIMPLE_FIELD_MAP: Record<string, (profile: EgovProfile) => unknown> = {
  "First Name": (p) => asString(p.first_name),
  "Middle Name": (p) => asString(p.middle_name),
  "Last Name": (p) => asString(p.last_name),
  Suffix: (p) => asString(p.suffix),
  "Email Address": (p) => asString(p.email),
  "Date of Birth": (p) => asString(p.birth_date),
  Gender: (p) => asUppercaseString(p.gender),
  "Mobile Number": (p) => asString(p.mobile),
  "Street Address": (p) => asString(p.street),
  "Postal Code": (p) => asNumber(p.postal),
  "Full Address": (p) => asString(p.address),
  "Address Line 2": (p) => asString(p.address_line_2),
  "Foreign Address": (p) => asString(p.foreign_address),
  // Occupation is NOT here — needs option-matching (handled separately below), not a
  // plain passthrough. Nationality/Country are NOT here either — DimCountries-backed
  // (see COUNTRY_BACKED_FIELDS), not real DimFieldOption rows, so encodeFieldValue's
  // SINGLE_SELECT branch (which only checks DimFieldOption) can never validate them.
  "Marital Status": (p) => asString(p.additional_information?.other_personal_information?.marital_status),
  Religion: (p) => asString(p.additional_information?.other_personal_information?.religion),
  Weight: (p) => asNumber(p.additional_information?.health_data?.weight),
  Height: (p) => asNumber(p.additional_information?.health_data?.height),
  Industry: (p) => asString(p.additional_information?.industry?.industry),
  "Salary Range": (p) => asString(p.additional_information?.expected_salary?.expected_salary),
};

const COUNTRY_BACKED_FIELDS = new Set(["Nationality", "Country"]);

// Submits one field's answer in isolation — a validation failure here (thrown by
// encodeFieldValue, e.g. an eGov value that doesn't match any seeded option) is caught and
// logged, never allowed to take down the rest of the sync.
async function submitOneSafely(userId: string, input: SubmitFieldAnswerInput, context: string): Promise<void> {
  try {
    await submitFieldAnswers(userId, [input]);
  } catch (error) {
    console.error(`[EgovAnswerSync] Failed to submit "${context}" for user ${userId}:`, error);
  }
}

// Nationality/Country/etc. bypass encodeFieldValue's DimFieldOption validation entirely —
// same raw-write escape hatch prisma/factories/demoPersonaFactory.ts's COUNTRY_BACKED_FIELDS
// uses, since these fields' real "options" come from DimCountries, not DimFieldOption.
async function writeRawSafely(userId: string, fieldId: string, value: string, context: string): Promise<void> {
  try {
    const existing = await prisma.fctUserFieldAnswer.findFirst({ where: { userId, fieldId, repeaterGroupId: null } });
    if (existing) {
      await prisma.fctUserFieldAnswer.update({ where: { id: existing.id }, data: { field_value: value, updatedById: userId } });
    } else {
      await prisma.fctUserFieldAnswer.create({ data: { userId, fieldId, repeaterGroupId: null, field_value: value, createdById: userId } });
    }
  } catch (error) {
    console.error(`[EgovAnswerSync] Failed to raw-write "${context}" for user ${userId}:`, error);
  }
}

export async function syncEgovProfileToAnswers(userId: string, profile: EgovProfile): Promise<void> {
  const topLevelFields = await prisma.dimField.findMany({
    where: { classification: "GLOBAL", parentFieldId: null },
    select: { id: true, englishName: true },
  });
  const byName = new Map(topLevelFields.map((f) => [f.englishName, f.id]));

  for (const [englishName, fieldId] of byName) {
    if (englishName === "Residence") {
      // Stored as the bare leaf barangay PSGC code (a plain string) — same shape any real
      // Residence answer takes (see fieldAnswer.service.ts's encodeFieldValue), not the
      // frontend's full PsgcAddressValue display object.
      const barangayCode = stripEgovPsgcCode(profile.barangay_code);
      if (barangayCode) await submitOneSafely(userId, { fieldId, value: barangayCode }, "Residence");
      continue;
    }

    if (COUNTRY_BACKED_FIELDS.has(englishName)) {
      const value = englishName === "Nationality" ? asString(profile.nationality) : asString(profile.country);
      if (value) await writeRawSafely(userId, fieldId, value, englishName);
      continue;
    }

    const mapper = SIMPLE_FIELD_MAP[englishName];
    if (!mapper) continue;

    const value = mapper(profile);
    if (value !== null) await submitOneSafely(userId, { fieldId, value }, englishName);
  }

  // Occupation: its option `value`s are generated codes (e.g. toSnakeCaseKey("Manufacturing")
  // -> "MANUFACTURING"), not eGov's raw free-text string — match case-insensitively against
  // each option's englishName, same as frontend/src/lib/egov-profile-map.ts's
  // resolveEgovOccupationValues. No match -> "Others" + "Please Specify Occupation", same
  // fallback a human filling this in by hand would end up at.
  const rawOccupation = asString(profile.additional_information?.occupation?.occupation);
  const occupationFieldId = byName.get("Occupation");
  if (rawOccupation && occupationFieldId) {
    const options = await prisma.dimFieldOption.findMany({ where: { fieldId: occupationFieldId }, select: { englishName: true, value: true } });
    const matched = options.find((o) => o.englishName.toLowerCase() === rawOccupation.toLowerCase());
    if (matched) {
      await submitOneSafely(userId, { fieldId: occupationFieldId, value: matched.value }, "Occupation");
    } else {
      const others = options.find((o) => o.englishName.toLowerCase() === "others");
      if (others) await submitOneSafely(userId, { fieldId: occupationFieldId, value: others.value }, "Occupation (Others fallback)");
      const pleaseSpecifyFieldId = byName.get("Please Specify Occupation");
      if (pleaseSpecifyFieldId) await submitOneSafely(userId, { fieldId: pleaseSpecifyFieldId, value: rawOccupation }, "Please Specify Occupation");
    }
  }

  // Educational Attainment (REPEATER_GROUP) — reuse the user's existing row if one already
  // exists (max rows is seeded at 1) instead of creating a second one on every re-login.
  // School is skipped: it's DimSchool-backed free text with no seeded value to match
  // against here, no reliable option-matching path. Educational Background is now plain
  // TEXT (no longer SINGLE_SELECT — it had zero seeded options, see profileFields.data.ts),
  // so it's a direct passthrough like Level/From/To, no option-matching needed.
  const entries = profile.additional_information?.educational_attainment;
  const educationFieldId = byName.get("Educational Attainment");
  if (entries && entries.length > 0 && educationFieldId) {
    try {
      const subfields = await prisma.dimField.findMany({ where: { parentFieldId: educationFieldId }, select: { id: true, englishName: true } });
      const subfieldByName = new Map(subfields.map((f) => [f.englishName, f.id]));

      const existingGroups = await fetchAnswerGroups(userId, educationFieldId);
      const group = existingGroups[0] ?? (await createAnswerGroup(userId, educationFieldId));

      const entry = entries[0];
      if (!entry) return;

      // maxRows = 1 — only the first eGov entry fits
      const levelId = subfieldByName.get("Level");
      if (levelId && entry.level) await submitOneSafely(userId, { fieldId: levelId, value: asString(entry.level), repeaterGroupId: group.id }, "Educational Attainment > Level");
      const backgroundId = subfieldByName.get("Educational Background");
      if (backgroundId && entry.educational_background) {
        await submitOneSafely(userId, { fieldId: backgroundId, value: asString(entry.educational_background), repeaterGroupId: group.id }, "Educational Attainment > Educational Background");
      }
      const fromId = subfieldByName.get("From");
      if (fromId && entry.from != null) await submitOneSafely(userId, { fieldId: fromId, value: asNumber(entry.from), repeaterGroupId: group.id }, "Educational Attainment > From");
      const toId = subfieldByName.get("To");
      if (toId && entry.to != null) await submitOneSafely(userId, { fieldId: toId, value: asNumber(entry.to), repeaterGroupId: group.id }, "Educational Attainment > To");
    } catch (error) {
      console.error(`[EgovAnswerSync] Failed to sync Educational Attainment for user ${userId}:`, error);
    }
  }
}
