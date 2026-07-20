import { Navigate, Outlet } from "react-router-dom";
import { useAuth, type Role } from "@/lib/auth";

interface RequireRoleProps {
  allow: Role[];
  redirectTo?: string;
}

export function RequireRole({ allow, redirectTo = "/" }: RequireRoleProps) {
  const { role } = useAuth();

  if (!allow.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
