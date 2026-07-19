import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MockAuthProvider } from "@/lib/mock-auth";
import { AnswersProvider } from "@/lib/answers-store";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { RequireRole } from "@/components/layout/RequireRole";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";

import { LandingPage } from "@/pages/public/LandingPage";
import { FormPage } from "@/pages/public/FormPage";
import { EligibleBenefitsPage } from "@/pages/public/EligibleBenefitsPage";
import { AnswerMorePage } from "@/pages/public/AnswerMorePage";
import { BenefitDetailsPage } from "@/pages/public/BenefitDetailsPage";
import { ProfilePage } from "@/pages/public/ProfilePage";

import { UsersPage } from "@/pages/admin/UsersPage";
import { GroupsPage } from "@/pages/admin/GroupsPage";
import { MyGroupPage } from "@/pages/admin/MyGroupPage";
import { AgentMatesPage } from "@/pages/admin/AgentMatesPage";
import { BenefitsAdminPage } from "@/pages/admin/BenefitsAdminPage";
import { FieldsAdminPage } from "@/pages/admin/FieldsAdminPage";

function App() {
  return (
    <MockAuthProvider>
      <AnswersProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<RequireRole allow={["GUEST", "USER"]} redirectTo="/admin/benefits" />}>
              <Route element={<PublicLayout />}>
                <Route index element={<LandingPage />} />
                <Route path="form" element={<FormPage />} />
                <Route path="my-benefits" element={<EligibleBenefitsPage />} />
                <Route path="answer-more" element={<AnswerMorePage />} />
                <Route path="benefits/:id" element={<BenefitDetailsPage />} />
                <Route element={<RequireRole allow={["USER"]} />}>
                  <Route path="profile" element={<ProfilePage />} />
                </Route>
              </Route>
            </Route>

            <Route element={<RequireRole allow={["SUPERADMIN", "AGENT"]} redirectTo="/" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route element={<RequireRole allow={["SUPERADMIN"]} redirectTo="/admin/benefits" />}>
                  <Route path="users" element={<UsersPage />} />
                  <Route path="groups" element={<GroupsPage />} />
                </Route>
                <Route element={<RequireRole allow={["AGENT"]} redirectTo="/admin/benefits" />}>
                  <Route path="my-group" element={<MyGroupPage />} />
                  <Route path="agent-mates" element={<AgentMatesPage />} />
                </Route>
                <Route path="benefits" element={<BenefitsAdminPage />} />
                <Route path="fields" element={<FieldsAdminPage />} />
              </Route>
            </Route>
          </Routes>
          <RoleSwitcher />
        </BrowserRouter>
      </AnswersProvider>
    </MockAuthProvider>
  );
}

export default App;
