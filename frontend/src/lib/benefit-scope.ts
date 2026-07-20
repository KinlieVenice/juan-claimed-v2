import type { FctBenefit } from "@/types/domain";

// Shared "Scope" display text — replaces the old mock era's flat scopeName string, which
// doesn't exist on the real API shape (a benefit's location is a psgcCodes[] array, each
// resolved server-side to a human name — see benefit.service.ts's getPsgcLocation).
// Reused by BenefitCard.tsx, BenefitDetailsPage.tsx, and the admin list's Scope column so
// the "Nationwide vs N location(s)" phrasing stays identical everywhere it's shown.
export function formatBenefitScope(benefit: Pick<FctBenefit, "isNationwide" | "benefitPsgcCodes">): string {
  if (benefit.isNationwide) return "Nationwide";

  const names = benefit.benefitPsgcCodes.map((pc) => pc.locationName ?? pc.psgcCode);
  if (names.length === 0) return "No locations set";
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1} more`;
}
