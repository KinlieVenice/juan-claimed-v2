import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

// eGov App SSO API v2 (https://e.gov.ph/developers#api-tabs) hands the exchange code to
// the eGov APP, which then relays it to us — normally via a redirect/callback URL
// registered with the eGov administrator. We don't have one registered yet, so this
// collects the code via a manual paste-in (obtained from eGov's own "Generate Exchange
// Code" playground) instead of a real redirect. Swapping to a real redirect later only
// touches this component — POST /api/auth/egov's contract doesn't change.
export function EgovSignInButton() {
  const { loginWithEgov } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await loginWithEgov(code.trim());
      setOpen(false);
      navigate("/my-benefits");
    } catch {
      setError("Could not verify that exchange code with eGovPH. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="lg" className="w-full gap-2 rounded-full">
          <ShieldCheck className="size-4" />
          Sign in with eGovPH
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sign in with eGovPH</DialogTitle>
          <DialogDescription>
            Paste the exchange code from your eGov app session. (No redirect URL is registered yet, so this is a
            manual step for now.)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField label="Exchange code" value={code} onChange={setCode} hint="e.g. YVVPXX4EYE5J4" autoFocus required />
          {error && <p className="text-xs font-medium text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={submitting || !code.trim()} className="w-full rounded-full">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Continue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
