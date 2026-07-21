import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Sun } from "@/components/apply/Sun";

// Shared header for every apply/* page — same clay-yellow sun mark + JuanClaimed wordmark
// the co-dev's static prototype used on every route (dev-feat-initial-KIN, commit 8baced3),
// just now aware of real auth state instead of a dead "#" link.
export function ApplyChrome() {
  const { role, logout } = useAuth();

  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-5 md:py-6">
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

      <div className="flex items-center gap-2">
        {role === "USER" ? (
          <>
            <Link
              to="/my-benefits"
              className="clay px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 md:px-5 md:py-2.5"
            >
              My Benefits
            </Link>
            <Link
              to="/profile"
              className="clay-blue px-4 py-2 text-sm font-semibold text-[color:var(--color-ph-blue)] transition hover:-translate-y-0.5 md:px-5 md:py-2.5"
            >
              Profile
            </Link>
            <button
              type="button"
              onClick={logout}
              className="clay-red px-4 py-2 text-sm font-semibold text-[color:var(--color-ph-red)] transition hover:-translate-y-0.5 md:px-5 md:py-2.5"
            >
              Log out
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="clay-blue px-4 py-2 text-sm font-semibold text-[color:var(--color-ph-blue)] transition hover:-translate-y-0.5 md:px-5 md:py-2.5"
          >
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}

// Shared footer, same as the header — one PH-pride sign-off across every apply/* page.
export function ApplyFooter() {
  return (
    <footer className="border-t border-slate-200/70 bg-white/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-8 md:flex-row md:items-center md:gap-6 md:px-5 md:py-10">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="clay-yellow grid h-8 w-8 place-items-center md:h-10 md:w-10">
            <div className="h-4 w-4 md:h-5 md:w-5">
              <Sun />
            </div>
          </div>
          <div>
            <p className="font-display text-base font-black text-[color:var(--color-ph-blue)] md:text-lg">JuanClaimed</p>
            <p className="text-[10px] text-slate-500 md:text-xs">Para sa bawat Juan.</p>
          </div>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-500 md:text-right md:text-xs">
          Know every benefit you deserve.
          <br />© {new Date().getFullYear()} JuanClaimed.
        </p>
      </div>
    </footer>
  );
}
