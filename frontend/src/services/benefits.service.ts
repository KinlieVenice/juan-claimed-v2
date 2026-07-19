// Mirrors GET /api/rule-groups/benefits/:id + the benefit CRUD the co-dev owns server-side
// (backend has separate benefit/requirement/utilization/rule-group services today — no
// composite endpoint exists yet there). createBenefitComposite/updateBenefitComposite are
// forward-looking: same "one call, everything bundled" shape as this session's
// backend/src/services/field.service.ts addField/editField, in case a real composite
// endpoint gets built later.
import { delay } from "@/lib/delay";
import { listBenefits, getBenefitById as mockGetBenefitById, upsertBenefit } from "@/mock/benefits.mock";
import { evaluateEligibility, type MatchStatus } from "@/lib/eligibility";
import type { FctBenefit, FctBenefitRequirement, FctBenefitUtilization, RuleTreeRoot } from "@/types/domain";

export async function getBenefits(): Promise<FctBenefit[]> {
  await delay();
  return listBenefits();
}

export async function getBenefitById(id: string): Promise<FctBenefit | undefined> {
  await delay();
  return mockGetBenefitById(id);
}

export interface EligibilityResult {
  benefit: FctBenefit;
  status: MatchStatus;
}

export async function getEligibilityResults(answers: Record<string, unknown>): Promise<EligibilityResult[]> {
  await delay(300);
  return listBenefits().map((benefit) => ({
    benefit,
    status: evaluateEligibility(benefit.eligibilityTree, answers),
  }));
}

export interface BenefitCompositeInput {
  id?: string;
  name: string;
  englishDescription: string;
  tagalogDescription: string;
  isNationwide: boolean;
  scopeName: string;
  requirements: Omit<FctBenefitRequirement, "id" | "benefitId">[];
  utilizations: Omit<FctBenefitUtilization, "id" | "benefitId">[];
  eligibilityTree: RuleTreeRoot;
}

function toRequirements(benefitId: string, items: BenefitCompositeInput["requirements"]): FctBenefitRequirement[] {
  return items.map((item, index) => ({ ...item, id: `req-${benefitId}-${index}`, benefitId }));
}

function toUtilizations(benefitId: string, items: BenefitCompositeInput["utilizations"]): FctBenefitUtilization[] {
  return items.map((item, index) => ({ ...item, id: `util-${benefitId}-${index}`, benefitId }));
}

export async function createBenefitComposite(input: BenefitCompositeInput): Promise<FctBenefit> {
  await delay(400);
  const id = input.id ?? `pending-${Date.now()}`;
  return upsertBenefit({
    id: input.id,
    name: input.name,
    englishDescription: input.englishDescription,
    tagalogDescription: input.tagalogDescription,
    isNationwide: input.isNationwide,
    scopeName: input.scopeName,
    eligibilityTree: input.eligibilityTree,
    benefitRequirements: toRequirements(id, input.requirements),
    benefitUtilizations: toUtilizations(id, input.utilizations),
  });
}

export async function updateBenefitComposite(id: string, input: BenefitCompositeInput): Promise<FctBenefit> {
  await delay(400);
  return upsertBenefit({
    id,
    name: input.name,
    englishDescription: input.englishDescription,
    tagalogDescription: input.tagalogDescription,
    isNationwide: input.isNationwide,
    scopeName: input.scopeName,
    eligibilityTree: input.eligibilityTree,
    benefitRequirements: toRequirements(id, input.requirements),
    benefitUtilizations: toUtilizations(id, input.utilizations),
  });
}
