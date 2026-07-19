import { Outlet } from "react-router-dom";
import { TopHeader } from "@/components/layout/TopHeader";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <TopHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border/70 py-6">
        <p className="mx-auto max-w-6xl px-6 text-center text-xs text-muted-foreground">
          Juan-Claimed — a no-code benefits finder. Integrated with eGovPH (view-only).
        </p>
      </footer>
    </div>
  );
}
