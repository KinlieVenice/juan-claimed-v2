import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/services/users.service";

interface UserIdentityCellProps {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
}

export function UserIdentityCell({ firstName, lastName, email, avatarUrl }: UserIdentityCellProps) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9 shrink-0 ring-2 ring-background">
        {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {firstName} {lastName}
        </p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
    </div>
  );
}

// Badge color by role instead of a flat gray outline — Superadmin gets the PH-flag gold
// accent, Agent gets the brand blue, User stays neutral. Soft tinted pills (bg-x/10, full
// opacity text), not the solid default/warning Badge variants — those are full-saturation
// (white-on-blue, dark-on-bright-gold) and read as harsh in a dense table full of them.
const ROLE_BADGE_CLASSNAME: Record<UserRole, string> = {
  SUPERADMIN: "border-transparent bg-accent text-accent-foreground",
  AGENT: "border-transparent bg-primary/10 text-primary",
  USER: "border-transparent bg-secondary text-secondary-foreground",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge className={ROLE_BADGE_CLASSNAME[role]}>{role}</Badge>;
}

export function StatusDot({ active, activeLabel = "Active", inactiveLabel = "Inactive" }: { active: boolean; activeLabel?: string; inactiveLabel?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
      <span className={cn("size-1.5 shrink-0 rounded-full", active ? "bg-success" : "bg-muted-foreground/40")} />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
