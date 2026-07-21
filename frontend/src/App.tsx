import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { AnswersProvider } from "@/lib/answers-store";
import { AlertProvider } from "@/lib/alert-store";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { RequireRole } from "@/components/layout/RequireRole";

import { LandingPage } from "@/pages/public/LandingPage";
import { LoginPage } from "@/pages/public/LoginPage";
import { ResetPasswordPage } from "@/pages/public/ResetPasswordPage";
import { FormPage } from "@/pages/public/FormPage";
import { EligibleBenefitsPage } from "@/pages/public/EligibleBenefitsPage";
import { AnswerMorePage } from "@/pages/public/AnswerMorePage";
import { BenefitDetailsPage } from "@/pages/public/BenefitDetailsPage";
import { ProfilePage } from "@/pages/public/ProfilePage";
import { AnsweredFormPage } from "@/pages/public/AnsweredFormPage";

import { AllUsersPage } from "@/pages/admin/AllUsersPage";
import { AgentsStaffPage } from "@/pages/admin/AgentsStaffPage";
import { GroupsPage } from "@/pages/admin/GroupsPage";
import { MyGroupPage } from "@/pages/admin/MyGroupPage";
import { AgentMatesPage } from "@/pages/admin/AgentMatesPage";
import { BenefitsAdminPage } from "@/pages/admin/BenefitsAdminPage";
import { FieldsAdminPage } from "@/pages/admin/FieldsAdminPage";
import { AdminProfilePage } from "@/pages/admin/AdminProfilePage";
import TableUi from "./pages/tests/TableUi";

// Blocks the route tree until a stored session (if any) has been rehydrated via
// GET /api/auth/me — otherwise a returning logged-in user would flash the
// guest-routed landing page for a moment before flipping to their real role.
function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  return <>{children}</>;
}

// A Superadmin-triggered password reset sets forceResetPassword — until the agent
// changes it via /reset-password, every other route (admin or public) redirects there.
function ForceResetGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (user?.forceResetPassword && location.pathname !== "/reset-password") {
    return <Navigate to="/reset-password" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <AnswersProvider>
          <BrowserRouter>
            <AuthGate>
              <ForceResetGate>
                <Routes>
                  <Route element={<RequireRole allow={["GUEST"]} redirectTo="/" />}>
                    <Route path="/login" element={<LoginPage />} />
                  </Route>

                  <Route element={<RequireRole allow={["SUPERADMIN", "AGENT"]} redirectTo="/" />}>
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                  </Route>

                  <Route element={<RequireRole allow={["GUEST", "USER"]} redirectTo="/admin/benefits" />}>
                    <Route element={<PublicLayout />}>
                      {/* testing only, dont touch */}
                      <Route path="tests" element={<TableUi />} />

                      <Route index element={<LandingPage />} />
                      <Route path="form" element={<FormPage />} />
                      <Route path="my-benefits" element={<EligibleBenefitsPage />} />
                      <Route path="answer-more" element={<AnswerMorePage />} />
                      <Route path="answered" element={<AnsweredFormPage />} />
                      <Route path="benefits/:id" element={<BenefitDetailsPage />} />
                      <Route element={<RequireRole allow={["USER"]} />}>
                        <Route path="profile" element={<ProfilePage />} />
                      </Route>
                    </Route>
                  </Route>

                  <Route element={<RequireRole allow={["SUPERADMIN", "AGENT"]} redirectTo="/" />}>
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route element={<RequireRole allow={["SUPERADMIN"]} redirectTo="/admin/benefits" />}>
                        <Route path="users" element={<AllUsersPage />} />
                        <Route path="agents" element={<AgentsStaffPage />} />
                        <Route path="groups" element={<GroupsPage />} />
                      </Route>
                      <Route element={<RequireRole allow={["AGENT"]} redirectTo="/admin/benefits" />}>
                        <Route path="my-group" element={<MyGroupPage />} />
                        <Route path="agent-mates" element={<AgentMatesPage />} />
                      </Route>
                      <Route path="benefits" element={<BenefitsAdminPage />} />
                      <Route path="fields" element={<FieldsAdminPage />} />
                      <Route path="profile" element={<AdminProfilePage />} />
                    </Route>
                  </Route>
                </Routes>
              </ForceResetGate>
            </AuthGate>
          </BrowserRouter>
        </AnswersProvider>
      </AuthProvider>
    </AlertProvider>
  );
}

export default App;
