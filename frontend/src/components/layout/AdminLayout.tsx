import * as React from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";

export function AdminLayout() {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-muted/30">
      <Sidebar mobileOpen={mobileNavOpen} onMobileOpenChange={setMobileNavOpen} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Below md, the Sidebar's desktop rail is hidden entirely — this bar is the only
            way back into it (opens the same nav content as a left-sliding drawer). */}
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-background px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-muted"
          >
            <Menu className="size-5" />
          </button>
          <img src="/logo.png" alt="JuanClaimed" className="h-6 w-auto" />
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden thin-scrollbar">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:px-8 md:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
