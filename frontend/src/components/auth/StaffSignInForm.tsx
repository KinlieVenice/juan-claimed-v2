import * as React from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

// Username+password sign-in for AGENT/SUPERADMIN staff accounts (POST /api/auth/login) —
// USER accounts never have a password, they always come through Google or eGov.
//
// VITE_PRESET_USERNAME/VITE_PRESET_PASSWORD are a demo-only convenience — pre-fills this
// form with a real seeded staff account (e.g. superadmin_main / password123) so a live demo
// doesn't need to type/remember credentials. Both unset (the normal case outside a demo) ->
// the fields just start empty, unchanged from before.
export function StaffSignInForm() {
  const { loginWithPassword } = useAuth();
  const [username, setUsername] = React.useState(() => import.meta.env.VITE_PRESET_USERNAME ?? "");
  const [password, setPassword] = React.useState(() => import.meta.env.VITE_PRESET_PASSWORD ?? "");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // No explicit navigate — /login's RequireRole guard (GUEST-only) redirects to the
      // right role's home the instant this flips the session's role away from GUEST (see
      // RequireRole.tsx's ROLE_HOME). An explicit navigate here used to race that redirect
      // and lose, since the guard reacts to the role change before this continuation runs.
      // (A forced password reset still wins over either — see App.tsx's ForceResetGate,
      // which sits above RequireRole entirely.)
      await loginWithPassword(username, password);
    } catch {
      setError("Incorrect username or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <TextField label="Username" value={username} onChange={setUsername} autoFocus required />
      <TextField label="Password" type="password" value={password} onChange={setPassword} required />
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      <Button type="submit" className="w-full rounded-full" disabled={submitting || !username || !password}>
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}
