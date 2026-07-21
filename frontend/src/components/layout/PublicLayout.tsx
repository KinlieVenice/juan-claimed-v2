import { Outlet } from "react-router-dom";

// Every route under here (LandingPage, FormPage, EligibleBenefitsPage, AnswerMorePage,
// BenefitDetailsPage, ProfilePage) renders its own full clay page shell — ApplyChrome
// header + ApplyFooter — via components/apply/*, so this layout stays a bare Outlet.
// It used to also render the old admin-style TopHeader/footer here, which stacked a
// second, differently-styled header/footer above/below each page's own; that's the "double
// header" that was showing.
export function PublicLayout() {
  return <Outlet />;
}
