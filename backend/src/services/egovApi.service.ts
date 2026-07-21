import axios from "axios";

// Thin wrapper around every eGovPH API call this app makes. Nothing here knows about
// DimUser, JWTs, or app-level error codes (that's auth.service.ts's job) — this file only
// knows how to talk to eGov's HTTP API and throws EGOV_API_ERROR on failure, leaving the
// caller to decide what that means for its own flow.
//
// Docs: https://e.gov.ph/developers#api-tabs (eGovAPI Postman workspace, "Generate an eGov
// exchange code" request). EGOV_BASE_URL currently points at the hackathon sandbox
// (hackathon-sso.e.gov.ph); swapping to production later is just an env var change.
const EGOV_BASE_URL = process.env.EGOV_BASE_URL as string;
const EGOV_PARTNER_CODE = process.env.EGOV_PARTNER_CODE as string;
const EGOV_PARTNER_SECRET = process.env.EGOV_PARTNER_SECRET as string;

// Full shape of POST /api/partner/sso_authentication's "data" object — kept 1:1 with what
// eGov actually returns (not trimmed to what auth.service.ts happens to use today) so the
// raw profile can be handed to the frontend as-is for later use (KYC prefill, address sync,
// etc. — not decided yet, see loginWithEgov's egovProfile passthrough).
export interface EgovProfile {
  uniqid: string;
  email: string;
  birth_date?: string | null;
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  suffix?: string | null;
  gender?: string | null;
  nationality?: string | null;
  photo?: string;
  mobile?: string | null;
  address?: string | null;
  street?: string | null;
  barangay?: string | null;
  municipality?: string | null;
  region?: string | null;
  province?: string | null;
  country?: string | null;
  country_alpha_2_code?: string | null;
  country_alpha_3_code?: string | null;
  postal?: string | null;
  address_line_2?: string | null;
  barangay_code?: string | null;
  province_code?: string | null;
  municipality_code?: string | null;
  region_code?: string | null;
  country_id?: number | null;
  foreign_address?: string | null;
  signature?: string | null;
  occupation?: string | null;
  // Everything below sits under a nested "additional_information" block instead of the
  // flat fields above — see the team's field-mapping table (Marital Status, Religion,
  // Weight, Height, Educational Attainment, Industry, Salary Range).
  additional_information?: EgovAdditionalInformation | null;
}

export interface EgovEducationalAttainmentEntry {
  level?: string | null;
  school?: string | null;
  from?: number | string | null;
  educational_background?: string | null;
  to?: number | string | null;
}

export interface EgovAdditionalInformation {
  other_personal_information?: {
    marital_status?: string | null;
    religion?: string | null;
  } | null;
  health_data?: {
    weight?: number | string | null;
    height?: number | string | null;
  } | null;
  educational_attainment?: EgovEducationalAttainmentEntry[] | null;
  industry?: {
    industry?: string | null;
  } | null;
  expected_salary?: {
    expected_salary?: string | null;
  } | null;
}

const egovRequestFailed = (context: string, error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    console.error(`[EgovApiService] ${context}:`, error.response?.status, error.response?.data);
  } else {
    console.error(`[EgovApiService] ${context}:`, error);
  }
  return new Error(`EGOV_API_ERROR: ${context}`);
};

// POST /api/token — exchange a one-time exchange_code (issued by the eGov app on the
// client) for a short-lived access_token scoped to SSO_AUTHENTICATION.
export const mintAccessToken = async (exchangeCode: string): Promise<string> => {
  let response;
  try {
    response = await axios.post(
      `${EGOV_BASE_URL}/api/token`,
      {
        exchange_code: exchangeCode,
        scope: "SSO_AUTHENTICATION",
        partner_code: EGOV_PARTNER_CODE,
        partner_secret: EGOV_PARTNER_SECRET,
      },
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    throw egovRequestFailed("eGov token exchange failed", error);
  }

  const accessToken = response.data?.access_token;
  if (!accessToken) {
    throw egovRequestFailed("eGov token exchange returned no access_token", response.data);
  }

  return accessToken as string;
};

// POST /api/partner/sso_authentication — resolve an access_token (from mintAccessToken)
// into the applicant's eGov identity/profile.
export const fetchProfile = async (accessToken: string): Promise<EgovProfile> => {
  let response;
  try {
    response = await axios.post(`${EGOV_BASE_URL}/api/partner/sso_authentication`, null, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch (error) {
    throw egovRequestFailed("eGov profile fetch failed", error);
  }

  const profile = response.data?.data as EgovProfile | undefined;
  if (!profile?.uniqid || !profile.email) {
    throw egovRequestFailed("eGov profile fetch returned an incomplete profile", response.data);
  }

  return profile;
};
