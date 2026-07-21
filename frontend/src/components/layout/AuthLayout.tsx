import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Sun } from "@/components/apply/Sun";
import { ClayCard } from "@/components/apply/ClayCard";

const BENEFITS = [
  "Your progress and answers are saved automatically",
  "Come back anytime without redoing the form",
  "See new benefits as soon as you qualify for them",
];

// Shared two-column shell for /login and /reset-password — the front door everyone walks
// through (public users AND agency staff, via the collapsible sign-in inside LoginPage)
// before ever reaching the serious admin dashboard shell, so it wears the same clay/PH-flag
// "fun" skin as the rest of apply/*. Reuses Sun/ClayCard, the same wrapper components those
// pages already use — nothing here touches AdminLayout/Sidebar or any admin-only UI.
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="apply-bg min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center px-4 py-4 md:px-5 md:py-6">
        <Link to="/" className="flex items-center gap-2 md:gap-3">
          <div className="clay-yellow grid h-9 w-9 place-items-center md:h-11 md:w-11">
            <div className="h-5 w-5 md:h-6 md:w-6">
              <Sun />
            </div>
          </div>
          <div className="leading-tight">
            <p className="font-display text-lg font-black tracking-tight text-[color:var(--color-ph-blue)] md:text-xl">JuanClaimed</p>
            <p className="text-[8px] tracking-[0.18em] text-slate-500 uppercase md:text-[10px]">Para sa bawat Juan</p>
          </div>
        </Link>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pb-16 md:px-5 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-10">
        <div className="hidden lg:block">
          <span className="clay-blue inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--color-ph-blue)]">
            Welcome back
          </span>
          <h1 className="mt-4 font-display text-3xl font-black leading-[1.05] tracking-tight text-slate-900 lg:text-5xl">
            Your benefits, <span className="text-[color:var(--color-ph-blue)]">all in one place.</span>
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600 lg:text-base">
            Sign in to save your answers and pick up right where you left off.
          </p>
          <ul className="mt-8 space-y-3">
            {BENEFITS.map((item) => (
              <li key={item} className="clay flex items-start gap-3 px-4 py-3 text-sm text-slate-700">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[color:var(--color-ph-blue)]" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xs text-slate-500">Integrated with eGovPH · view-only</p>
        </div>

        <ClayCard className="mx-auto w-full max-w-sm p-8 md:p-10">
          <div className="space-y-8">{children}</div>
        </ClayCard>
      </div>
    </div>
  );
}
