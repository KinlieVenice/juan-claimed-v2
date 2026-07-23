import { Navigate, Outlet } from "react-router-dom";
import { useAuth, type Role } from "@/lib/auth";

/** Where each role lands when bounced off a route it's not allowed on. */
const ROLE_HOME: Record<Role, string> = {
  GUEST: "/",
  USER: "/my-benefits",
  AGENT: "/admin/benefits",
  SUPERADMIN: "/admin/benefits",
};

interface RequireRoleProps {
  allow: Role[];
  /** Fixed redirect target, for the rare case every disallowed role should land on the
   * SAME page regardless of which one they are. Omit (the normal case) to send them to
   * their OWN role's home instead — e.g. a USER whose session just flipped from GUEST
   * while still sitting on /login (GUEST-only) lands on /my-benefits, not a hardcoded "/".
   * A static redirectTo here is what let that race land a fresh login on the landing page:
   * the explicit navigate("/my-benefits") a sign-in button fires afterward can't win against
   * this guard's own redirect, which reacts to the role flip first. */
  redirectTo?: string;
}

export function RequireRole({ allow, redirectTo }: RequireRoleProps) {
  const { role } = useAuth();

  if (!allow.includes(role)) {
    return <Navigate to={redirectTo ?? ROLE_HOME[role]} replace />;
  }

  return <Outlet />;
}
