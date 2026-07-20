import { Link } from "react-router-dom";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { ClayBadge } from "@/components/ClayBadge";

const BENEFITS = [
  "Your progress and answers are saved automatically",
  "Come back anytime without redoing the form",
  "See new benefits as soon as you qualify for them",
];

// Shared two-column shell for /login and /reset-password — same left branding panel,
// different right-side form (per "same as login ui, diff form").
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary px-12 py-12 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 70%, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <Link to="/" className="relative flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-white/15">
            <ShieldCheck className="size-4.5" />
          </div>
          <span className="text-sm font-bold tracking-tight">Juan-Claimed</span>
        </Link>

        <div className="relative space-y-8">
          <ClayBadge />
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-balance">
              Welcome back to your benefits, all in one place.
            </h1>
            <p className="text-sm leading-relaxed text-primary-foreground/80">
              Sign in to save your answers and pick up right where you left off.
            </p>
          </div>
          <ul className="space-y-2.5">
            {BENEFITS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-primary-foreground/90">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-foreground/60">Integrated with eGovPH · view-only</p>
      </div>

      <div className="flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm space-y-8">{children}</div>
      </div>
    </div>
  );
}
