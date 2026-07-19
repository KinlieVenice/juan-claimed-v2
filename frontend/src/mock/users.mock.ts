import type { DimGroup, DimUser } from "@/types/domain";

export const groups: DimGroup[] = [
  { id: "grp-dswd", name: "Department of Social Welfare and Development", description: "National agency overseeing social welfare programs." },
  { id: "grp-doh", name: "Department of Health", description: "National agency overseeing PWD and health-related benefits." },
  { id: "grp-cavite-lgu", name: "Cavite Provincial Government", description: "Local government unit for Cavite province." },
];

export const users: DimUser[] = [
  { id: "u-superadmin", username: "sandra.reyes", email: "sandra.reyes@juanclaimed.gov.ph", firstName: "Sandra", lastName: "Reyes", role: "SUPERADMIN", groupId: null, active: true },
  { id: "u-agent", username: "arnold.cruz", email: "arnold.cruz@juanclaimed.gov.ph", firstName: "Arnold", lastName: "Cruz", role: "AGENT", groupId: "grp-cavite-lgu", active: true },
  { id: "u-agent-2", username: "bea.santos", email: "bea.santos@juanclaimed.gov.ph", firstName: "Bea", lastName: "Santos", role: "AGENT", groupId: "grp-cavite-lgu", active: true },
  { id: "u-agent-3", username: "carlo.tan", email: "carlo.tan@juanclaimed.gov.ph", firstName: "Carlo", lastName: "Tan", role: "AGENT", groupId: "grp-dswd", active: false },
  { id: "u-user", username: "juana.delacruz", email: "juana.delacruz@gmail.com", firstName: "Juana", lastName: "Dela Cruz", role: "USER", groupId: null, active: true },
];

export function getGroupById(id: string): DimGroup | undefined {
  return groups.find((g) => g.id === id);
}

export function getAgentMates(currentUserId: string): DimUser[] {
  const current = users.find((u) => u.id === currentUserId);
  if (!current?.groupId) return [];
  return users.filter((u) => u.role === "AGENT" && u.groupId === current.groupId && u.id !== currentUserId);
}
