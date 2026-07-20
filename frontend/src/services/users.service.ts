// Real — wraps GET/POST/PATCH/DELETE /api/users and GET /api/groups (backend/routes.md).
import { apiFetch, apiFetchEnvelope } from "@/lib/api";
import type { Scope } from "@/services/scopes.service";

export type UserRole = "SUPERADMIN" | "AGENT" | "USER";

export interface UserGroup {
  id: string;
  englishName: string;
  tagalogName: string;
  englishDescription: string;
  tagalogDescription: string;
}

export interface RealUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  role: UserRole;
  psgcCode: string | null;
  scopeId: string | null;
  groupId: string | null;
  scope: Scope | null;
  group: UserGroup | null;
  avatarUrl: string | null;
  active: boolean;
  forceResetPassword: boolean;
  createdAt: string;
}

export interface CreateUserInput {
  username: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  role: UserRole;
  scopeId?: string | null;
  groupId?: string | null;
  psgcCode?: string | null;
  /** Required for SUPERADMIN/AGENT, must be omitted for USER — see routes.md's matrix. */
  password?: string;
}

export interface AssignRoleInput {
  role: UserRole;
  scopeId?: string | null;
  groupId?: string | null;
  psgcCode?: string | null;
}

export async function getUsers(token: string): Promise<RealUser[]> {
  return apiFetch<RealUser[]>("/api/users", { token });
}

export async function getUserById(id: string, token: string): Promise<RealUser> {
  return apiFetch<RealUser>(`/api/users/${id}`, { token });
}

export interface SavedUser {
  data: RealUser;
  /** The backend's own success message — show as-is via useAlert. */
  message: string;
}

export async function createUser(input: CreateUserInput, token: string): Promise<SavedUser> {
  return apiFetchEnvelope<RealUser>("/api/users", { method: "POST", body: JSON.stringify(input), token });
}

export async function assignUserRole(id: string, input: AssignRoleInput, token: string): Promise<SavedUser> {
  return apiFetchEnvelope<RealUser>(`/api/users/${id}/role`, { method: "PATCH", body: JSON.stringify(input), token });
}

export async function setUserActive(id: string, active: boolean, token: string): Promise<SavedUser> {
  return apiFetchEnvelope<RealUser>(`/api/users/${id}/active`, { method: "PATCH", body: JSON.stringify({ active }), token });
}

export async function deleteUser(id: string, token: string): Promise<{ id: string; deletedAt: string }> {
  return apiFetch(`/api/users/${id}`, { method: "DELETE", token });
}

export interface ResetPasswordResult {
  data: { user: RealUser; temporaryPassword: string };
  message: string;
}

export async function resetUserPassword(id: string, token: string): Promise<ResetPasswordResult> {
  return apiFetchEnvelope(`/api/users/${id}/reset-password`, { method: "POST", token });
}

export interface CreateUpdateGroupInput {
  englishName: string;
  tagalogName: string;
  englishDescription: string;
  tagalogDescription: string;
}

// Groups — GET is public per routes.md; create/update require mockAuth + SUPERADMIN.
export async function getGroups(): Promise<UserGroup[]> {
  return apiFetch<UserGroup[]>("/api/groups");
}

export async function getGroupById(id: string): Promise<UserGroup> {
  return apiFetch<UserGroup>(`/api/groups/${id}`);
}

export interface SavedGroup {
  data: UserGroup;
  /** The backend's own success message — show as-is via useAlert. */
  message: string;
}

export async function createGroup(input: CreateUpdateGroupInput, token: string): Promise<SavedGroup> {
  return apiFetchEnvelope<UserGroup>("/api/groups", { method: "POST", body: JSON.stringify(input), token });
}

export async function updateGroup(id: string, input: CreateUpdateGroupInput, token: string): Promise<SavedGroup> {
  return apiFetchEnvelope<UserGroup>(`/api/groups/${id}`, { method: "PUT", body: JSON.stringify(input), token });
}

// No dedicated backend endpoint for "agents in my group" — filtered client-side from an
// already-fetched user list rather than a separate fetch.
export function filterAgentMates(users: RealUser[], currentUserId: string): RealUser[] {
  const current = users.find((u) => u.id === currentUserId);
  if (!current?.groupId) return [];
  return users.filter((u) => u.role === "AGENT" && u.groupId === current.groupId && u.id !== currentUserId);
}
