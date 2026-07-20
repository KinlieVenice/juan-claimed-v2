import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useAlert } from "@/lib/alert-store";
import {
  createBenefitBundle,
  updateBenefitBundle,
  deleteBenefitItem,
  deleteBenefitItemAttachment,
  type BenefitBundleInput,
  type EligibilityTreeInput,
} from "@/services/benefits.service";
import { getFields, getFieldConditionOperators } from "@/services/fields.service";
import { getHierarchies } from "@/services/fieldHierarchy.service";
import { getGroups, type UserGroup } from "@/services/users.service";
import { getScopes, type Scope } from "@/services/scopes.service";
import { resolveAgentJurisdictionPrefix, type JurisdictionPrefixEntry } from "@/lib/agentJurisdiction";
import type { DimField, DimFieldConditionOperator, DimFieldHierarchy, FctBenefit, RuleTreeNode, RuleTreeRoot } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextField, TextareaField } from "@/components/ui/text-field";
import { SidePanel } from "@/components/ui/side-panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RuleTreeBuilder } from "@/components/benefits/RuleTreeBuilder";
import { BenefitScopeFields } from "@/components/benefits/BenefitScopeFields";
import { BenefitItemListEditor, stripBenefitItems, type LocalBenefitItem } from "@/components/benefits/BenefitItemListEditor";
import type { LocalAttachment } from "@/components/benefits/AttachmentUploader";

const PH_LOCATION_HIERARCHY_KEY = "PH_LOCATION";

interface BenefitFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create mode; otherwise editing (or, with viewOnly, viewing) this benefit. */
  benefit: FctBenefit | null;
  /** Read-only presentation — every input locked, footer is just "Close". Same mechanism as
   * FieldFormModal's viewOnly: the form's `inert` attribute, not per-field disabled props. */
  viewOnly?: boolean;
  onSaved: () => void;
}

const FORM_ID = "benefit-form";
const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`);
const emptyTree = (): RuleTreeRoot => ({ kind: "group", id: newId(), logicalOperator: "ALL", children: [] });

// Frontend-only per-node `id` is for React keys / editor state — the backend assigns real
// ids, so it's stripped before submitting. Same convention as FieldFormModal.tsx's stripTreeIds.
function stripTreeIds(node: RuleTreeNode): EligibilityTreeInput {
  if (node.kind === "group") {
    return { kind: "group", logicalOperator: node.logicalOperator, children: node.children.map(stripTreeIds) };
  }
  return { kind: "condition", fieldId: node.fieldId, fieldConditionOperatorId: node.fieldConditionOperatorId, conditionFieldValue: node.conditionFieldValue };
}

function toLocalAttachments(attachments: FctBenefit["benefitRequirements"][number]["attachments"]): LocalAttachment[] {
  return attachments.map((a) => ({
    localId: newId(),
    id: a.id,
    fileLabel: a.fileLabel,
    fileName: a.fileName,
    fileType: a.fileType,
    filePath: a.filePath,
    fileSize: Number(a.fileSize),
  }));
}

function toLocalItems(items: { id: string; englishName: string; tagalogName: string; englishDescription: string; tagalogDescription: string; attachments: FctBenefit["benefitRequirements"][number]["attachments"] }[]): LocalBenefitItem[] {
  return items.map((item) => ({
    localId: newId(),
    id: item.id,
    englishName: item.englishName,
    tagalogName: item.tagalogName,
    englishDescription: item.englishDescription,
    tagalogDescription: item.tagalogDescription,
    attachments: toLocalAttachments(item.attachments),
  }));
}

// Everything a benefit needs, bundled into one save call — same "one call, everything
// bundled" philosophy as FieldFormModal.tsx (which itself mirrors field.service.ts's
// addField/editField), now that POST/PATCH /api/benefit-bundles does the same for benefits.
export function BenefitFormModal({ open, onOpenChange, benefit, viewOnly, onSaved }: BenefitFormModalProps) {
  const { token, user } = useAuth();
  const { showAlert, showApiError } = useAlert();

  const [name, setName] = React.useState("");
  const [englishDescription, setEnglishDescription] = React.useState("");
  const [tagalogDescription, setTagalogDescription] = React.useState("");
  const [isNationwide, setIsNationwide] = React.useState(true);
  const [psgcCodes, setPsgcCodes] = React.useState<string[]>([]);
  const [psgcLocationNames, setPsgcLocationNames] = React.useState<Record<string, string>>({});
  const [groupIds, setGroupIds] = React.useState<string[]>([]);

  const [requirements, setRequirements] = React.useState<LocalBenefitItem[]>([]);
  const [deletedRequirementIds, setDeletedRequirementIds] = React.useState<string[]>([]);
  const [deletedRequirementAttachmentIds, setDeletedRequirementAttachmentIds] = React.useState<{ itemId: string; attachmentId: string }[]>([]);

  const [utilizations, setUtilizations] = React.useState<LocalBenefitItem[]>([]);
  const [deletedUtilizationIds, setDeletedUtilizationIds] = React.useState<string[]>([]);
  const [deletedUtilizationAttachmentIds, setDeletedUtilizationAttachmentIds] = React.useState<{ itemId: string; attachmentId: string }[]>([]);

  const [howToApplies, setHowToApplies] = React.useState<LocalBenefitItem[]>([]);
  const [deletedHowToApplyIds, setDeletedHowToApplyIds] = React.useState<string[]>([]);
  const [deletedHowToApplyAttachmentIds, setDeletedHowToApplyAttachmentIds] = React.useState<{ itemId: string; attachmentId: string }[]>([]);

  const [eligibilityTree, setEligibilityTree] = React.useState<RuleTreeRoot>(emptyTree());
  const originalStrippedTreeRef = React.useRef<string>("");

  const [fields, setFields] = React.useState<DimField[]>([]);
  const [operators, setOperators] = React.useState<DimFieldConditionOperator[]>([]);
  const [hierarchies, setHierarchies] = React.useState<DimFieldHierarchy[]>([]);
  const [groups, setGroups] = React.useState<UserGroup[]>([]);
  const [scopes, setScopes] = React.useState<Scope[]>([]);
  const [jurisdictionPrefix, setJurisdictionPrefix] = React.useState<JurisdictionPrefixEntry[]>([]);

  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    if (benefit) {
      setName(benefit.name);
      setEnglishDescription(benefit.englishDescription);
      setTagalogDescription(benefit.tagalogDescription);
      setIsNationwide(benefit.isNationwide);
      setPsgcCodes(benefit.benefitPsgcCodes.map((pc) => pc.psgcCode));
      setPsgcLocationNames(Object.fromEntries(benefit.benefitPsgcCodes.map((pc) => [pc.psgcCode, pc.locationName ?? pc.psgcCode])));
      setGroupIds(benefit.benefitGroups.map((g) => g.groupId));

      setRequirements(toLocalItems(benefit.benefitRequirements));
      setDeletedRequirementIds([]);
      setDeletedRequirementAttachmentIds([]);

      setUtilizations(toLocalItems(benefit.benefitUtilizations));
      setDeletedUtilizationIds([]);
      setDeletedUtilizationAttachmentIds([]);

      setHowToApplies(toLocalItems(benefit.benefitHowToApplies));
      setDeletedHowToApplyIds([]);
      setDeletedHowToApplyAttachmentIds([]);

      const loadedTree = benefit.eligibilityTree ?? emptyTree();
      setEligibilityTree(loadedTree);
      originalStrippedTreeRef.current = JSON.stringify(stripTreeIds(loadedTree));
    } else {
      setName("");
      setEnglishDescription("");
      setTagalogDescription("");
      setIsNationwide(true);
      setPsgcCodes([]);
      setPsgcLocationNames({});
      setGroupIds([]);

      setRequirements([]);
      setDeletedRequirementIds([]);
      setDeletedRequirementAttachmentIds([]);

      setUtilizations([]);
      setDeletedUtilizationIds([]);
      setDeletedUtilizationAttachmentIds([]);

      setHowToApplies([]);
      setDeletedHowToApplyIds([]);
      setDeletedHowToApplyAttachmentIds([]);

      const freshTree = emptyTree();
      setEligibilityTree(freshTree);
      originalStrippedTreeRef.current = JSON.stringify(stripTreeIds(freshTree));
    }
  }, [open, benefit]);

  // notConditional fields excluded at the query level — a benefit's eligibility tree must
  // never be able to target one (see field.service.ts's fetchAllFields conditionable param).
  React.useEffect(() => {
    if (!open || !token) return;
    getFields(token, undefined, { conditionable: true }).then(setFields);
    getFieldConditionOperators(undefined, token).then(setOperators);
    getHierarchies(token).then(setHierarchies);
    getGroups().then(setGroups);
    getScopes(token).then(setScopes);
  }, [open, token]);

  // Residency is scoped through the Scope tab's own PSGC picker (a system-designed,
  // first-line eligibility check) and echoed read-only on the Eligibility tab below — an
  // admin must not also be able to add a manual "Residence" condition to the tree, so the
  // PH_LOCATION-backed field is excluded from RuleTreeBuilder's own field picker entirely.
  // Fields' own dependency conditioning (FieldConditionTreeBuilder.tsx) is unaffected.
  const phLocationHierarchyId = React.useMemo(() => hierarchies.find((h) => h.key === PH_LOCATION_HIERARCHY_KEY)?.id, [hierarchies]);
  const topLevelFields = React.useMemo(
    () => fields.filter((f) => f.parentFieldId === null && f.fieldInputType.value !== "REPEATER_GROUP" && f.fieldHierarchyId !== phLocationHierarchyId),
    [fields, phLocationHierarchyId],
  );

  // Resolves once scopes/user are available — empty (unlocked) for SUPERADMIN/NATIONAL.
  React.useEffect(() => {
    if (!open || !user) return;
    const scopeValue = scopes.find((s) => s.id === user.scopeId)?.value;
    resolveAgentJurisdictionPrefix(user.role, scopeValue, user.psgcCode).then(setJurisdictionPrefix);
  }, [open, user, scopes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    try {
      const strippedTree = stripTreeIds(eligibilityTree) as EligibilityTreeInput;
      const includeEligibilityTree = benefit
        ? JSON.stringify(strippedTree) !== originalStrippedTreeRef.current
        : eligibilityTree.children.length > 0;

      const payload: BenefitBundleInput = {
        name,
        englishDescription,
        tagalogDescription,
        nationwide: isNationwide,
        psgcCodes: isNationwide ? [] : psgcCodes,
        groupIds: isNationwide ? groupIds : [],
        requirements: stripBenefitItems(requirements),
        utilizations: stripBenefitItems(utilizations),
        howToApplies: stripBenefitItems(howToApplies),
        ...(includeEligibilityTree ? { eligibilityTree: strippedTree } : {}),
      };

      const saved = benefit ? await updateBenefitBundle(benefit.id, payload, token) : await createBenefitBundle(payload, token);
      const benefitId = saved.data.id;

      for (const id of deletedRequirementIds) await deleteBenefitItem("requirements", benefitId, id, token);
      for (const { itemId, attachmentId } of deletedRequirementAttachmentIds) await deleteBenefitItemAttachment("requirements", benefitId, itemId, attachmentId, token);

      for (const id of deletedUtilizationIds) await deleteBenefitItem("utilizations", benefitId, id, token);
      for (const { itemId, attachmentId } of deletedUtilizationAttachmentIds) await deleteBenefitItemAttachment("utilizations", benefitId, itemId, attachmentId, token);

      for (const id of deletedHowToApplyIds) await deleteBenefitItem("how-to-apply", benefitId, id, token);
      for (const { itemId, attachmentId } of deletedHowToApplyAttachmentIds) await deleteBenefitItemAttachment("how-to-apply", benefitId, itemId, attachmentId, token);

      onSaved();
      onOpenChange(false);
      showAlert({ variant: "success", message: saved.message });
    } catch (err) {
      showApiError(err, "Could not save this benefit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={viewOnly ? "View Benefit" : benefit ? "Edit Benefit" : "Add Benefit"}
      description={viewOnly ? "Read-only view." : "Basic info, scope, requirements, utilization, how to apply, and eligibility — all in one save."}
      footer={
        viewOnly ? (
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" form={FORM_ID} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {benefit ? "Save Changes" : "Create Benefit"}
            </Button>
          </>
        )
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className={cn(viewOnly && "opacity-90")} inert={viewOnly || undefined}>
        <Tabs defaultValue="basic">
          {/* Horizontally-scrollable tab strip — six tabs is more than a fixed-width row
              fits comfortably, so this scrolls as a unit instead of wrapping/squishing.
              Each trigger is shrink-0 so it keeps its natural width instead of the
              TabsList's default flex-1 evenly-dividing behavior. */}
          <div className="overflow-x-auto thin-scrollbar">
            <TabsList className="w-max justify-start">
              <TabsTrigger value="basic" className="shrink-0">
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="scope" className="shrink-0">
                Scope
              </TabsTrigger>
              <TabsTrigger value="requirements" className="shrink-0">
                Requirements
              </TabsTrigger>
              <TabsTrigger value="utilization" className="shrink-0">
                Utilization
              </TabsTrigger>
              <TabsTrigger value="howToApply" className="shrink-0">
                How to Apply
              </TabsTrigger>
              <TabsTrigger value="eligibility" className="shrink-0">
                Eligibility
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="basic" className="space-y-6 pt-4">
            <TextField label="Name" value={name} onChange={setName} required />
            <TextareaField label="English Description" value={englishDescription} onChange={setEnglishDescription} required />
            <TextareaField label="Tagalog Description" value={tagalogDescription} onChange={setTagalogDescription} required />
          </TabsContent>

          {/* forceMount — unlike the other tabs, this one hosts a picker with meaningful
              in-progress UI state (which branches are expanded) that doesn't survive a
              remount; Radix unmounts inactive TabsContent by default, so switching away and
              back would otherwise reset that mid-drill-down state on every visit. Committed
              picks (psgcCodes) are already safe either way — this only preserves the picker's
              own tree-expansion UI. */}
          <TabsContent value="scope" forceMount className="space-y-6 pt-4 data-[state=inactive]:hidden">
            <BenefitScopeFields
              isNationwide={isNationwide}
              onNationwideChange={setIsNationwide}
              psgcCodes={psgcCodes}
              onPsgcCodesChange={setPsgcCodes}
              psgcLocationNames={psgcLocationNames}
              onLocationNameResolved={(code, name) => setPsgcLocationNames((prev) => ({ ...prev, [code]: name }))}
              groupIds={groupIds}
              onGroupIdsChange={setGroupIds}
              groups={groups}
              jurisdictionPrefix={jurisdictionPrefix}
            />
          </TabsContent>

          <TabsContent value="requirements" className="space-y-6 pt-4">
            <p className="text-xs text-muted-foreground">Optional — documents an applicant needs to provide.</p>
            <BenefitItemListEditor
              items={requirements}
              onChange={setRequirements}
              onRemoveExisting={(id) => setDeletedRequirementIds((prev) => [...prev, id])}
              onRemoveExistingAttachment={(itemId, attachmentId) => setDeletedRequirementAttachmentIds((prev) => [...prev, { itemId, attachmentId }])}
              addLabel="Add Requirement"
              emptyHint="No requirements yet — add one below (e.g. a Senior Citizen ID)."
            />
          </TabsContent>

          <TabsContent value="utilization" className="space-y-6 pt-4">
            <p className="text-xs text-muted-foreground">Optional — tips for making the most of this benefit once granted.</p>
            <BenefitItemListEditor
              items={utilizations}
              onChange={setUtilizations}
              onRemoveExisting={(id) => setDeletedUtilizationIds((prev) => [...prev, id])}
              onRemoveExistingAttachment={(itemId, attachmentId) => setDeletedUtilizationAttachmentIds((prev) => [...prev, { itemId, attachmentId }])}
              addLabel="Add Utilization Tip"
              emptyHint="No utilization tips yet — add one below."
            />
          </TabsContent>

          <TabsContent value="howToApply" className="space-y-6 pt-4">
            <p className="text-xs text-muted-foreground">Optional — step-by-step application instructions.</p>
            <BenefitItemListEditor
              items={howToApplies}
              onChange={setHowToApplies}
              onRemoveExisting={(id) => setDeletedHowToApplyIds((prev) => [...prev, id])}
              onRemoveExistingAttachment={(itemId, attachmentId) => setDeletedHowToApplyAttachmentIds((prev) => [...prev, { itemId, attachmentId }])}
              addLabel="Add Step"
              emptyHint="No application steps yet — add one below."
            />
          </TabsContent>

          <TabsContent value="eligibility" className="space-y-6 pt-4">
            <div className="space-y-1.5 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
              <p className="text-xs font-semibold text-foreground">Residency</p>
              {isNationwide ? (
                <p className="text-xs text-muted-foreground">Nationwide — no residency restriction.</p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Belongs To</span>
                    {psgcCodes.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">no locations picked yet</span>
                    ) : (
                      psgcCodes.map((code) => (
                        <Badge key={code} variant="secondary" className="text-[11px]">
                          {psgcLocationNames[code] ?? code}
                        </Badge>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">Configured in the Scope tab.</p>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground">Optional — the AND/OR condition tree that determines who qualifies.</p>
            <RuleTreeBuilder fields={topLevelFields} operators={operators} hierarchies={hierarchies} tree={eligibilityTree} onChange={setEligibilityTree} />
          </TabsContent>
        </Tabs>
      </form>
    </SidePanel>
  );
}
