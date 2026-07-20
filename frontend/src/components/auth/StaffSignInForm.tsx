import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

// Username+password sign-in for AGENT/SUPERADMIN staff accounts (POST /api/auth/login) —
// USER accounts never have a password, they always come through Google or eGov.
export function StaffSignInForm() {
  const { loginWithPassword } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await loginWithPassword(username, password);
      navigate("/admin/benefits");
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
