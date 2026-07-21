import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";

// Shared header for every apply/* page — the JuanClaimed logo wordmark (public/logo.png)
// the co-dev's static prototype used on every route (dev-feat-initial-KIN, commit 8baced3),
// just now aware of real auth state instead of a dead "#" link.
export function ApplyChrome() {
  const { role, logout } = useAuth();

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-5 md:py-6">
      <Link to="/" className="flex items-center">
        <img src="/logo.png" alt="JuanClaimed" className="h-9 w-auto md:h-11" />
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
        <img src="/logo.png" alt="JuanClaimed" className="h-8 w-auto md:h-10" />
        <p className="text-[10px] leading-relaxed text-slate-500 md:text-right md:text-xs">
          Know every benefit you deserve.
          <br />© {new Date().getFullYear()} JuanClaimed.
        </p>
      </div>
    </footer>
  );
}
