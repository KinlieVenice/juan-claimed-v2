// Real — wraps /api/benefits and /api/benefit-bundles (backend/routes.md).
import { apiFetch, apiFetchEnvelope } from "@/lib/api";
import { evaluateEligibility, type MatchStatus } from "@/lib/eligibility";
import type { FctBenefit, RuleTreeRoot } from "@/types/domain";

// token is optional on the read functions (apiFetch falls back to the persisted session
// token when omitted — see lib/api.ts) since the public applicant-facing pages
// (EligibleBenefitsPage.tsx etc.) don't thread one through explicitly; admin call sites
// pass their own from useAuth() anyway, same convention as fields.service.ts.
export async function getBenefits(token?: string): Promise<FctBenefit[]> {
  return apiFetch<FctBenefit[]>("/api/benefits", { token });
}

export async function getBenefitById(id: string, token?: string): Promise<FctBenefit> {
  return apiFetch<FctBenefit>(`/api/benefits/${id}`, { token });
}

export async function deleteBenefit(id: string, token: string): Promise<void> {
  await apiFetch<{ id: string }>(`/api/benefits/${id}`, { method: "DELETE", token });
}

export interface EligibilityResult {
  /** Narrowed to a non-null tree — getEligibilityResults filters out benefits without one
   * before this is built, so consumers don't need to null-check it again. */
  benefit: FctBenefit & { eligibilityTree: RuleTreeRoot };
  status: MatchStatus;
}

// Client-side eligibility check against a live benefit list — lib/eligibility.ts is a
// self-disclosed simplified matcher (not condition.util.ts's real compare()/
// matchRuleGroupTree engine), unchanged by this pass; only the benefit source here moved
// off mock data onto the real GET /api/benefits list + real eligibilityTree shape.
export async function getEligibilityResults(answers: Record<string, unknown>, token?: string): Promise<EligibilityResult[]> {
  const benefits = await getBenefits(token);
  return benefits
    .filter((benefit): benefit is FctBenefit & { eligibilityTree: RuleTreeRoot } => benefit.eligibilityTree !== null)
    .map((benefit) => ({ benefit, status: evaluateEligibility(benefit.eligibilityTree, answers) }));
}

export interface AttachmentInput {
  /** Present = edit this existing attachment; absent = create a new one. */
  id?: string;
  fileLabel: string;
  fileName: string;
  fileType: string;
  /** The Vercel Blob URL — see attachments.service.ts's upload flow. */
  filePath: string;
  fileSize: number;
  metaData?: Record<string, unknown>;
}

// Requirements/Utilizations/How to Apply all share this exact shape server-side
// (benefitBundle.request.ts) — same reason BenefitItemListEditor.tsx is one shared
// component instead of three near-identical ones.
export interface BenefitItemInput {
  /** Present = edit this existing row; absent = create a new one. Omitted from the
   * payload entirely (not just id-less) means "leave it alone" — this app always submits
   * every current row, so nothing is ever silently dropped; use the individual DELETE
   * endpoints to actually remove one. */
  id?: string;
  englishName: string;
  tagalogName: string;
  englishDescription: string;
  tagalogDescription: string;
  attachments?: AttachmentInput[];
}

// The submitted tree never carries the frontend's synthetic per-node `id` (React keys /
// editor state only) — matches RuleTreeRoot minus `id`, same "strip before submit"
// convention fields.service.ts's DynamicConditionTreeInput follows.
export type EligibilityTreeInput =
  | { kind: "group"; logicalOperator: "ALL" | "ANY"; children: EligibilityTreeInput[] }
  | { kind: "condition"; fieldId: string; fieldConditionOperatorId: string; conditionFieldValue: unknown };

export interface BenefitBundleInput {
  name: string;
  englishDescription: string;
  tagalogDescription: string;
  nationwide: boolean;
  psgcCodes: string[];
  groupIds: string[];
  requirements: BenefitItemInput[];
  utilizations: BenefitItemInput[];
  howToApplies: BenefitItemInput[];
  /** Omit entirely to leave the existing tree untouched on edit (wholesale-replaced only
   * when present — see backend's editBenefitRuleTreeWith). */
  eligibilityTree?: EligibilityTreeInput;
}

export interface SavedBenefit {
  data: FctBenefit;
  /** The backend's own success message — show as-is via useAlert, same convention as fields. */
  message: string;
}

export async function createBenefitBundle(input: BenefitBundleInput, token: string): Promise<SavedBenefit> {
  return apiFetchEnvelope<FctBenefit>("/api/benefit-bundles", { method: "POST", token, body: JSON.stringify(input) });
}

export async function updateBenefitBundle(id: string, input: BenefitBundleInput, token: string): Promise<SavedBenefit> {
  return apiFetchEnvelope<FctBenefit>(`/api/benefit-bundles/${id}`, { method: "PATCH", token, body: JSON.stringify(input) });
}

// The bundle's "omitted = untouched, not deleted" rule (see BenefitItemInput) means
// removing a row/attachment in the editor needs its own explicit DELETE call after the
// bundle save succeeds — same post-save cleanup pattern FieldFormModal.tsx uses for
// deletedOptionIds/deletedSubfieldIds/etc.
export type BenefitItemParentType = "requirements" | "utilizations" | "how-to-apply";

export async function deleteBenefitItem(parentType: BenefitItemParentType, benefitId: string, id: string, token: string): Promise<void> {
  await apiFetch<{ id: string }>(`/api/benefits/${benefitId}/${parentType}/${id}`, { method: "DELETE", token });
}

export async function deleteBenefitItemAttachment(
  parentType: BenefitItemParentType,
  benefitId: string,
  parentId: string,
  attachmentId: string,
  token: string,
): Promise<void> {
  await apiFetch<{ id: string }>(`/api/benefits/${benefitId}/${parentType}/${parentId}/attachments/${attachmentId}`, { method: "DELETE", token });
}
