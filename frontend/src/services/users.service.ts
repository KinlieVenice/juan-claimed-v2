// Mirrors GET /api/users, /api/groups (co-dev's domain server-side) — mock-only for now.
import { delay } from "@/lib/delay";
import { users, groups, getGroupById as mockGetGroupById, getAgentMates as mockGetAgentMates } from "@/mock/users.mock";
import type { DimGroup, DimUser } from "@/types/domain";

export async function getUsers(): Promise<DimUser[]> {
  await delay();
  return users;
}

export async function getGroups(): Promise<DimGroup[]> {
  await delay();
  return groups;
}

export async function getGroupById(id: string): Promise<DimGroup | undefined> {
  await delay();
  return mockGetGroupById(id);
}

export async function getAgentMates(currentUserId: string): Promise<DimUser[]> {
  await delay();
  return mockGetAgentMates(currentUserId);
}
