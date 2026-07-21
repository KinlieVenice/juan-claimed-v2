import type { LucideIcon } from "lucide-react";
import { Users, UserSquare2, Building2, Gift, ListChecks, Contact, UserCircle2 } from "lucide-react";
import type { Role } from "@/lib/auth";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

export type NavEntry = NavItem | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

const SUPERADMIN_NAV: NavEntry[] = [
  {
    label: "User Accounts",
    icon: Users,
    items: [
      { label: "All Users", to: "/admin/users", icon: UserSquare2 },
      { label: "Manage Agents", to: "/admin/agents", icon: Contact },
    ],
  },
  { label: "Groups", to: "/admin/groups", icon: Building2 },
  { label: "Benefit", to: "/admin/benefits", icon: Gift },
  { label: "Fields", to: "/admin/fields", icon: ListChecks },
];

const AGENT_NAV: NavEntry[] = [
  { label: "My Group", to: "/admin/my-group", icon: UserCircle2 },
  { label: "Benefit", to: "/admin/benefits", icon: Gift },
  { label: "Fields", to: "/admin/fields", icon: ListChecks },
];

export function getAdminNav(role: Role): NavEntry[] {
  if (role === "SUPERADMIN") return SUPERADMIN_NAV;
  if (role === "AGENT") return AGENT_NAV;
  return [];
}
