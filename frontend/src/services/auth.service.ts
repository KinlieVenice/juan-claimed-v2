// Unlike the other services/*.service.ts files in this folder, this one is real (not
// mock) — it calls the actual backend documented in backend/routes.md.
import { apiFetch } from "@/lib/api";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "SUPERADMIN" | "AGENT" | "USER";
  avatarUrl: string | null;
  groupId: string | null;
  scopeId: string | null;
  psgcCode: string | null;
  forceResetPassword: boolean;
}

// Mirrors backend/src/services/egovApi.service.ts's EgovProfile — the raw eGov SSO
// identity, kept 1:1 with what eGov returns rather than trimmed, since how this gets used
// (KYC prefill, address sync, ...) hasn't been decided yet.
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

interface LoginResult {
  token: string;
  user: AuthUser;
  /** Only present on the eGov SSO login path (loginWithEgov). */
  egovProfile?: EgovProfile;
}

export async function changePassword(currentPassword: string, newPassword: string, token: string): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
    token,
  });
}

export async function loginWithPassword(username: string, password: string): Promise<LoginResult> {
  return apiFetch<LoginResult>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function loginWithGoogle(idToken: string): Promise<LoginResult> {
  return apiFetch<LoginResult>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export async function loginWithEgov(exchangeCode: string): Promise<LoginResult> {
  return apiFetch<LoginResult>("/api/auth/egov", {
    method: "POST",
    body: JSON.stringify({ exchangeCode }),
  });
}

export async function getMe(token: string): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/me", { token });
}
