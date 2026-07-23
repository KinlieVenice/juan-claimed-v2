import * as React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { getAdminNav, isNavGroup, type NavItem } from "@/lib/nav";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AlertModal } from "@/components/ui/alert-modal";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

function SidebarLink({ item, indent, onNavigate }: { item: NavItem; indent?: boolean; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          indent && "py-2",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        )
      }
    >
      <item.icon className="size-4.5" />
      {item.label}
    </NavLink>
  );
}

interface SidebarProps {
  /** Mobile drawer open state — owned by AdminLayout (its hamburger button triggers this),
   * not this component, since the trigger lives in AdminLayout's mobile-only top bar. */
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

// Renders TWICE — once as the always-visible desktop rail (hidden below md), once as the
// exact same nav content inside a left-sliding Sheet for mobile (AdminLayout's hamburger
// opens it). Same nav/profile/logout markup either way via navContent below, so the two
// never drift out of sync with each other.
export function Sidebar({ mobileOpen, onMobileOpenChange }: SidebarProps) {
  const { role, user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = getAdminNav(role);

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}` : "?";

  const [confirmLogoutOpen, setConfirmLogoutOpen] = React.useState(false);

  const closeMobile = () => onMobileOpenChange(false);

  const handleLogout = () => {
    logout();
    closeMobile();
    navigate("/login");
  };

  const navContent = (
    <>
      <div className="flex shrink-0 items-center px-5 py-5">
        {/* w-full h-auto (not h-8 w-auto) — width now drives the sizing so the logo fills
            the row edge to edge, height scales proportionally to keep its real ratio. */}
        <img src="/logo.png" alt="JuanClaimed" className="h-auto w-full" />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 thin-scrollbar">
        {navItems.map((entry) =>
          isNavGroup(entry) ? (
            <div key={entry.label} className="space-y-1 pt-1">
              <div className="flex items-center gap-3 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/50">
                <entry.icon className="size-3.5" />
                {entry.label}
              </div>
              <div className="space-y-0.5 pl-3.5">
                {entry.items.map((item) => (
                  <SidebarLink key={item.to} item={item} indent onNavigate={closeMobile} />
                ))}
              </div>
            </div>
          ) : (
            <SidebarLink key={entry.to} item={entry} onNavigate={closeMobile} />
          ),
        )}
      </nav>

      <div className="flex shrink-0 items-center gap-2 border-t border-sidebar-border p-4">
        <NavLink
          to="/admin/profile"
          onClick={closeMobile}
          className={({ isActive }) =>
            cn(
              "flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
              isActive ? "bg-sidebar-accent" : "bg-sidebar-accent/50 hover:bg-sidebar-accent",
            )
          }
        >
          <Avatar className="size-9">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="truncate text-[10px] text-sidebar-foreground/50">{role}</p>
          </div>
        </NavLink>

        <button
          type="button"
          onClick={() => setConfirmLogoutOpen(true)}
          title="Logout"
          aria-label="Logout"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="size-4.5" />
        </button>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden h-dvh w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">{navContent}</aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" showCloseButton={false} className="flex w-72 max-w-[85vw] flex-col gap-0 bg-sidebar p-0 text-sidebar-foreground">
          {/* Visually hidden — Radix Dialog requires an accessible title even though the
              logo image above already serves as the visible one. */}
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          {navContent}
        </SheetContent>
      </Sheet>

      <AlertModal
        open={confirmLogoutOpen}
        onOpenChange={setConfirmLogoutOpen}
        variant="warning"
        title="Log out?"
        message="You'll need to sign in again to access the admin console."
        confirmLabel="Log out"
        onConfirm={handleLogout}
      />
    </>
  );
}
