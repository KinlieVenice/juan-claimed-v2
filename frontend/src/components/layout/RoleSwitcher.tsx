import { ShieldCheck, UserCog, UserRound, LogOut } from "lucide-react";
import { useAuth, type Role } from "@/lib/mock-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// DEV-ONLY: lets you preview every role's view without a real login. Delete this
// component (and its mount in App.tsx) once real auth is wired up.
const ROLES: { role: Role; label: string; icon: typeof ShieldCheck }[] = [
  { role: "GUEST", label: "Guest", icon: LogOut },
  { role: "USER", label: "User", icon: UserRound },
  { role: "AGENT", label: "Agent", icon: UserCog },
  { role: "SUPERADMIN", label: "Superadmin", icon: ShieldCheck },
];

export function RoleSwitcher() {
  const { role, setRole } = useAuth();

  return (
    <div className="fixed bottom-4 right-4 z-100 flex items-center gap-1 rounded-full border bg-card/95 p-1 shadow-lg backdrop-blur">
      <span className="pl-2 pr-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Preview as
      </span>
      {ROLES.map(({ role: r, label, icon: Icon }) => (
        <Button
          key={r}
          type="button"
          size="sm"
          variant={role === r ? "default" : "ghost"}
          className={cn("h-7 rounded-full px-2.5 text-xs", role === r && "shadow-sm")}
          onClick={() => setRole(r)}
        >
          <Icon className="size-3.5" />
          {label}
        </Button>
      ))}
    </div>
  );
}
