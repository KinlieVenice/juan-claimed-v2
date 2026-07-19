import * as React from "react";

export type Role = "GUEST" | "SUPERADMIN" | "AGENT" | "USER";

export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatarUrl?: string;
}

const MOCK_USERS: Record<Exclude<Role, "GUEST">, MockUser> = {
  SUPERADMIN: { id: "u-superadmin", firstName: "Sandra", lastName: "Reyes", email: "sandra.reyes@juanclaimed.gov.ph", role: "SUPERADMIN" },
  AGENT: { id: "u-agent", firstName: "Arnold", lastName: "Cruz", email: "arnold.cruz@juanclaimed.gov.ph", role: "AGENT" },
  USER: { id: "u-user", firstName: "Juana", lastName: "Dela Cruz", email: "juana.delacruz@gmail.com", role: "USER" },
};

interface MockAuthContextValue {
  role: Role;
  user: MockUser | null;
  setRole: (role: Role) => void;
}

const MockAuthContext = React.createContext<MockAuthContextValue | null>(null);

const STORAGE_KEY = "jc.mock-role";

function readStoredRole(): Role {
  if (typeof window === "undefined") return "GUEST";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "SUPERADMIN" || stored === "AGENT" || stored === "USER" || stored === "GUEST") return stored;
  return "GUEST";
}

// Mock-only: swapping to real auth later means changing what populates this context
// (a real /api/auth/me call) — nothing that consumes useAuth() needs to change.
export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<Role>(() => readStoredRole());

  const setRole = React.useCallback((next: Role) => {
    setRoleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const user = role === "GUEST" ? null : MOCK_USERS[role];

  const value = React.useMemo(() => ({ role, user, setRole }), [role, user, setRole]);

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(MockAuthContext);
  if (!ctx) throw new Error("useAuth must be used within a MockAuthProvider");
  return ctx;
}
