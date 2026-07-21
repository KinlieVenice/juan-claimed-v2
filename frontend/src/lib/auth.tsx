import * as React from "react";
import * as authService from "@/services/auth.service";
import { TOKEN_KEY, EGOV_PROFILE_KEY } from "@/lib/api";
import type { EgovProfile } from "@/services/auth.service";

export type Role = "GUEST" | "SUPERADMIN" | "AGENT" | "USER";

export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  groupId: string | null;
  scopeId: string | null;
  psgcCode: string | null;
  /** True right after a Superadmin password reset — the app redirects to /reset-password until this clears. */
  forceResetPassword: boolean;
}

interface AuthContextValue {
  /** "GUEST" when logged out — there is no mock/preview fallback anymore. */
  role: Role;
  user: AppUser | null;
  /** The raw JWT — pass as the `token` option to authenticated service calls. Null when logged out. */
  token: string | null;
  /**
   * Raw eGov SSO profile from the last loginWithEgov call (address, birth_date, PSGC codes,
   * signature, ...). Not persisted server-side yet, so it only survives a refresh via
   * localStorage, and only exists at all when the user signed in through eGov. Null
   * otherwise. How this actually gets used (prefill, verification, ...) isn't decided yet.
   */
  egovProfile: EgovProfile | null;
  /** True while rehydrating a stored session via GET /api/auth/me on load. */
  loading: boolean;
  loginWithPassword: (username: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithEgov: (exchangeCode: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const toAppUser = (u: authService.AuthUser): AppUser => ({
  id: u.id,
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  role: u.role,
  avatarUrl: u.avatarUrl,
  groupId: u.groupId,
  scopeId: u.scopeId,
  psgcCode: u.psgcCode,
  forceResetPassword: u.forceResetPassword,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY),
  );
  const [user, setUser] = React.useState<AppUser | null>(null);
  const [egovProfile, setEgovProfile] = React.useState<EgovProfile | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(EGOV_PROFILE_KEY);
    return stored ? (JSON.parse(stored) as EgovProfile) : null;
  });
  const [loading, setLoading] = React.useState(!!token);

  React.useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    authService
      .getMe(token)
      .then((u) => {
        if (!cancelled) {
          setUser(toAppUser(u));
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          window.localStorage.removeItem(TOKEN_KEY);
          window.localStorage.removeItem(EGOV_PROFILE_KEY);
          setToken(null);
          setUser(null);
          setEgovProfile(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const applyLogin = React.useCallback((result: { token: string; user: authService.AuthUser; egovProfile?: EgovProfile }) => {
    window.localStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(toAppUser(result.user));

    if (result.egovProfile) {
      window.localStorage.setItem(EGOV_PROFILE_KEY, JSON.stringify(result.egovProfile));
      setEgovProfile(result.egovProfile);
    }
  }, []);

  const loginWithPassword = React.useCallback(
    async (username: string, password: string) => {
      applyLogin(await authService.loginWithPassword(username, password));
    },
    [applyLogin],
  );

  const loginWithGoogle = React.useCallback(
    async (idToken: string) => {
      applyLogin(await authService.loginWithGoogle(idToken));
    },
    [applyLogin],
  );

  const loginWithEgov = React.useCallback(
    async (exchangeCode: string) => {
      applyLogin(await authService.loginWithEgov(exchangeCode));
    },
    [applyLogin],
  );

  const changePassword = React.useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!token) return;
      const updated = await authService.changePassword(currentPassword, newPassword, token);
      setUser(toAppUser(updated));
    },
    [token],
  );

  const logout = React.useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(EGOV_PROFILE_KEY);
    setToken(null);
    setUser(null);
    setEgovProfile(null);
  }, []);

  const role: Role = user?.role ?? "GUEST";

  const value = React.useMemo(
    () => ({
      role,
      user,
      token,
      egovProfile,
      loading,
      loginWithPassword,
      loginWithGoogle,
      loginWithEgov,
      changePassword,
      logout,
    }),
    [role, user, token, egovProfile, loading, loginWithPassword, loginWithGoogle, loginWithEgov, changePassword, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
