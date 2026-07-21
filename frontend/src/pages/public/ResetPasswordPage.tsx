import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAlert } from "@/lib/alert-store";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

export function ResetPasswordPage() {
  const { changePassword } = useAuth();
  const { showAlert, showApiError } = useAlert();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      showAlert({ variant: "warning", message: "New password and confirmation don't match." });
      return;
    }
    if (newPassword.length < 8) {
      showAlert({ variant: "warning", message: "New password must be at least 8 characters." });
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      navigate("/admin/agents");
    } catch (err) {
      showApiError(err, "Could not change your password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-2 text-center lg:text-left">
        <div className="clay-yellow mx-auto flex size-11 items-center justify-center text-[color:var(--color-ph-blue)] lg:mx-0">
          <KeyRound className="size-5" />
        </div>
        <h2 className="font-display text-2xl font-black text-slate-900">Set a New Password</h2>
        <p className="text-sm text-slate-600">Your password was reset by a Superadmin. Set a new one to continue.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7">
        <TextField
          label="Temporary password"
          type="password"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoFocus
          required
        />
        <TextField label="New password" type="password" value={newPassword} onChange={setNewPassword} minLength={8} required />
        <TextField
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          minLength={8}
          required
        />

        <Button type="submit" className="w-full rounded-full" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          Set New Password
        </Button>
      </form>
    </AuthLayout>
  );
}
