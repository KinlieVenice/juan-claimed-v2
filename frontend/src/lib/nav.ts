import type { LucideIcon } from "lucide-react";
import { Users, Building2, Gift, ListChecks, Contact, UserCircle2 } from "lucide-react";
import type { Role } from "@/lib/mock-auth";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const SUPERADMIN_NAV: NavItem[] = [
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Groups", to: "/admin/groups", icon: Building2 },
  { label: "Benefit", to: "/admin/benefits", icon: Gift },
  { label: "Fields", to: "/admin/fields", icon: ListChecks },
];

const AGENT_NAV: NavItem[] = [
  { label: "My Group", to: "/admin/my-group", icon: UserCircle2 },
  { label: "Agent Mates", to: "/admin/agent-mates", icon: Contact },
  { label: "Benefit", to: "/admin/benefits", icon: Gift },
  { label: "Fields", to: "/admin/fields", icon: ListChecks },
];

export function getAdminNav(role: Role): NavItem[] {
  if (role === "SUPERADMIN") return SUPERADMIN_NAV;
  if (role === "AGENT") return AGENT_NAV;
  return [];
}
