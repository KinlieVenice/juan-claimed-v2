// Maps the live eGov SSO profile (held in AuthProvider's egovProfile — see lib/auth.tsx,
// never persisted to the backend for an eGov login) onto this app's DimField.englishName
// keys, per the team's field-mapping table. Consumed by ProfilePage.tsx to fill in
// `values` for fields that have no real FctUserFieldAnswer row, since eGov SSO users never
// get one written for them.
//
// REPEATER_GROUP ("Educational Attainment") has its own function below
// (getEgovRepeaterRows) — FieldForm's normal RepeaterGroupInput reads rows straight from
// useAnswers()'s real `groups`/`answers` state, not from a `values` map, so it can't render
// eGov-sourced rows; FieldForm swaps in EgovRepeaterPreview.tsx for those instead.
import type { EgovProfile } from "@/services/auth.service";
import type { PsgcAddressValue } from "@/components/fields/PsgcPhLocationHierarchyField";

// eGov's PSGC codes are 10 digits; this app's (psgc.gitlab.io-backed) codes are the
// standard 9-digit PSGC format. Per the team's mapping table: drop the 3rd character
// (index 2) — e.g. "0105503021" -> "015503021".
const stripEgovPsgcCode = (code: string | null | undefined): string => (code ? code.slice(0, 2) + code.slice(3) : "");

const asString = (value: unknown): string | null => (value === null || value === undefined || value === "" ? null : String(value));

const asNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
};

// Simple (non-repeater) fields only — keyed by DimField.englishName, same convention
// profileFieldSeeder.ts uses to identify fields (englishName is unique).
const SIMPLE_FIELD_MAP: Record<string, (profile: EgovProfile) => unknown> = {
  "First Name": (p) => asString(p.first_name),
  "Middle Name": (p) => asString(p.middle_name),
  "Last Name": (p) => asString(p.last_name),
  Suffix: (p) => asString(p.suffix),
  "Email Address": (p) => asString(p.email),
  "Date of Birth": (p) => asString(p.birth_date),
  Gender: (p) => asString(p.gender),
  "Mobile Number": (p) => asString(p.mobile),
  Nationality: (p) => asString(p.nationality),
  Country: (p) => asString(p.country),
  "Street Address": (p) => asString(p.street),
  "Postal Code": (p) => asNumber(p.postal),
  "Full Address": (p) => asString(p.address),
  "Address Line 2": (p) => asString(p.address_line_2),
  "Foreign Address": (p) => asString(p.foreign_address),
  // Not locked (eGovField: false, self-authored option list) — this just seeds a starting
  // draft value; the applicant can still change it since our curated options rarely match
  // eGov's raw string verbatim.
  Occupation: (p) => asString(p.occupation),
  "Marital Status": (p) => asString(p.additional_information?.other_personal_information?.marital_status),
  Religion: (p) => asString(p.additional_information?.other_personal_information?.religion),
  Weight: (p) => asNumber(p.additional_information?.health_data?.weight),
  Height: (p) => asNumber(p.additional_information?.health_data?.height),
  Industry: (p) => asString(p.additional_information?.industry?.industry),
  "Salary Range": (p) => asString(p.additional_information?.expected_salary?.expected_salary),
};

const buildResidenceValue = (profile: EgovProfile): PsgcAddressValue | null => {
  if (!profile.barangay_code || !profile.municipality_code || !profile.province_code || !profile.region_code) return null;

  return {
    mode: "province",
    regionCode: stripEgovPsgcCode(profile.region_code),
    regionName: profile.region ?? "",
    subdivisionCode: stripEgovPsgcCode(profile.province_code),
    subdivisionName: profile.province ?? "",
    cityMunicipalityCode: stripEgovPsgcCode(profile.municipality_code),
    cityMunicipalityName: profile.municipality ?? "",
    barangayCode: stripEgovPsgcCode(profile.barangay_code),
    barangayName: profile.barangay ?? "",
    leafCode: stripEgovPsgcCode(profile.barangay_code),
    leafName: profile.barangay ?? "",
  };
};

/**
 * Builds a fieldId -> value map from the live eGov profile, for whichever of `fields` have
 * a mapping entry (matched by englishName). Fields with no mapping, or whose mapped value
 * comes back null/empty, are simply absent from the result.
 */
export function mapEgovProfileToFieldValues(
  fields: { id: string; englishName: string }[],
  egovProfile: EgovProfile | null,
): Record<string, unknown> {
  if (!egovProfile) return {};

  const values: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.englishName === "Residence") {
      const residence = buildResidenceValue(egovProfile);
      if (residence) values[field.id] = residence;
      continue;
    }

    const mapper = SIMPLE_FIELD_MAP[field.englishName];
    if (!mapper) continue;

    const value = mapper(egovProfile);
    if (value !== null) values[field.id] = value;
  }

  return values;
}

// Row shapes keyed by SUBFIELD englishName (not id — the caller doesn't know real subfield
// ids until it fetches them, same as EgovRepeaterPreview.tsx does for its table columns).
const EGOV_REPEATER_ROW_MAPPERS: Record<string, (profile: EgovProfile) => Record<string, unknown>[] | null> = {
  "Educational Attainment": (p) => {
    const entries = p.additional_information?.educational_attainment;
    if (!entries || entries.length === 0) return null;
    return entries.map((entry) => ({
      Level: asString(entry.level),
      School: asString(entry.school),
      From: asNumber(entry.from),
      "Educational Background": asString(entry.educational_background),
      To: asNumber(entry.to),
    }));
  },
};

/**
 * Rows for an eGov-backed REPEATER_GROUP field (currently only "Educational Attainment"),
 * or null if this field has no eGov mapping / the profile has no data for it — the caller
 * (FieldForm) falls back to the normal DB-backed RepeaterGroupInput in that case.
 */
export function getEgovRepeaterRows(fieldEnglishName: string, egovProfile: EgovProfile | null): Record<string, unknown>[] | null {
  if (!egovProfile) return null;
  const mapper = EGOV_REPEATER_ROW_MAPPERS[fieldEnglishName];
  if (!mapper) return null;
  return mapper(egovProfile);
}
