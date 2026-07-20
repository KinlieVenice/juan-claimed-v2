import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";

export function AdminLayout() {
  return (
    <div className="flex h-dvh overflow-hidden bg-muted/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden thin-scrollbar">
        <div className="mx-auto max-w-6xl px-8 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
