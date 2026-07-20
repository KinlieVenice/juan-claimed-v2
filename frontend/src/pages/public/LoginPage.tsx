import * as React from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { EgovSignInButton } from "@/components/auth/EgovSignInButton";
import { StaffSignInForm } from "@/components/auth/StaffSignInForm";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const [staffOpen, setStaffOpen] = React.useState(false);

  return (
    <AuthLayout>
      <div className="space-y-2 text-center lg:text-left">
        <h2 className="text-xl font-bold text-foreground">Sign in</h2>
        <p className="text-sm text-muted-foreground">Choose how you'd like to continue.</p>
      </div>

      <div className="space-y-3">
        <GoogleSignInButton />
        <EgovSignInButton />
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>

      <Link
        to="/form"
        className="block rounded-full border border-border px-4 py-2.5 text-center text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        Continue without signing in
      </Link>

      <div className="border-t border-border pt-6">
        <button
          type="button"
          onClick={() => setStaffOpen((v) => !v)}
          className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Agency staff sign-in
          <ChevronDown className={cn("size-3.5 transition-transform", staffOpen && "rotate-180")} />
        </button>
        {staffOpen && (
          <div className="mt-4">
            <StaffSignInForm />
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
