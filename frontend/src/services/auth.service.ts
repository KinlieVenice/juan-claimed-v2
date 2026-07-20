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

interface LoginResult {
  token: string;
  user: AuthUser;
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
