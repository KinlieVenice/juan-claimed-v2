import { NavLink } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { getAdminNav } from "@/lib/nav";
import { useAuth } from "@/lib/mock-auth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function Sidebar() {
  const { role, user } = useAuth();
  const navItems = getAdminNav(role);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "?";

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
          <ShieldCheck className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Juan-Claimed</p>
          <p className="text-[11px] text-sidebar-foreground/60">Admin Console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )
            }
          >
            <item.icon className="size-4.5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2.5">
          <Avatar className="size-9">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <Badge variant="secondary" className="mt-0.5 bg-sidebar-primary/20 text-[10px] text-sidebar-primary-foreground">
              {role}
            </Badge>
          </div>
        </div>
      </div>
    </aside>
  );
}
