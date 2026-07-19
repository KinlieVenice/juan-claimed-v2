import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";

export function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-8 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
