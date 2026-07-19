import * as React from "react";
import { FileText, Loader2, Plus, Trash2, X } from "lucide-react";
import { fields } from "@/mock/fields.mock";
import { createBenefitComposite, updateBenefitComposite, type BenefitCompositeInput } from "@/services/benefits.service";
import type { FctBenefit, RuleTreeRoot } from "@/types/domain";
import { RuleTreeBuilder } from "@/components/benefits/RuleTreeBuilder";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BenefitFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  benefit?: FctBenefit;
  onSaved: (benefit: FctBenefit) => void;
}

const topLevelFields = fields.filter((f) => f.parentFieldId === null && f.fieldInputType.value !== "REPEATER_GROUP");

const emptyTree = (): RuleTreeRoot => ({ kind: "group", id: "root", logicalOperator: "ALL", children: [] });

function toDraft(benefit?: FctBenefit): BenefitCompositeInput {
  if (!benefit) {
    return {
      name: "",
      englishDescription: "",
      tagalogDescription: "",
      isNationwide: true,
      scopeName: "Nationwide",
      requirements: [],
      utilizations: [],
      eligibilityTree: emptyTree(),
    };
  }
  return {
    id: benefit.id,
    name: benefit.name,
    englishDescription: benefit.englishDescription,
    tagalogDescription: benefit.tagalogDescription,
    isNationwide: benefit.isNationwide,
    scopeName: benefit.scopeName,
    requirements: benefit.benefitRequirements.map(({ englishName, tagalogName, englishDescription, tagalogDescription, documents }) => ({
      englishName,
      tagalogName,
      englishDescription,
      tagalogDescription,
      documents,
    })),
    utilizations: benefit.benefitUtilizations.map(({ englishName, tagalogName, englishDescription, tagalogDescription }) => ({
      englishName,
      tagalogName,
      englishDescription,
      tagalogDescription,
    })),
    eligibilityTree: benefit.eligibilityTree,
  };
}

// One composite call bundles basic info + requirements + utilization + the eligibility
// rule tree — same "everything connected, one go" philosophy as this session's backend
// field.service.ts addField/editField, applied here on the frontend/mock side (see
// services/benefits.service.ts's createBenefitComposite/updateBenefitComposite).
export function BenefitFormModal({ open, onOpenChange, benefit, onSaved }: BenefitFormModalProps) {
  const [draft, setDraft] = React.useState<BenefitCompositeInput>(() => toDraft(benefit));
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) setDraft(toDraft(benefit));
  }, [open, benefit]);

  const handleSave = async () => {
    setSaving(true);
    const saved = draft.id ? await updateBenefitComposite(draft.id, draft) : await createBenefitComposite(draft);
    setSaving(false);
    onSaved(saved);
    onOpenChange(false);
  };

  const updateRequirement = (index: number, patch: Partial<BenefitCompositeInput["requirements"][number]>) => {
    setDraft((d) => ({ ...d, requirements: d.requirements.map((r, i) => (i === index ? { ...r, ...patch } : r)) }));
  };

  const updateUtilization = (index: number, patch: Partial<BenefitCompositeInput["utilizations"][number]>) => {
    setDraft((d) => ({ ...d, utilizations: d.utilizations.map((u, i) => (i === index ? { ...u, ...patch } : u)) }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{benefit ? "Edit Benefit" : "Create Benefit"}</DialogTitle>
          <DialogDescription>Basic info, requirements, utilization tips, and eligibility — all in one save.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="min-h-0 flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
            <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
          </TabsList>

          <div className="mt-4 max-h-[52vh] overflow-y-auto pr-1">
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="benefit-name">Name</Label>
                <Input id="benefit-name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="benefit-desc-en">Description (English)</Label>
                <Textarea id="benefit-desc-en" value={draft.englishDescription} onChange={(e) => setDraft((d) => ({ ...d, englishDescription: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="benefit-desc-tl">Description (Tagalog)</Label>
                <Textarea id="benefit-desc-tl" value={draft.tagalogDescription} onChange={(e) => setDraft((d) => ({ ...d, tagalogDescription: e.target.value }))} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Nationwide</p>
                  <p className="text-xs text-muted-foreground">Available to applicants in any region.</p>
                </div>
                <Switch checked={draft.isNationwide} onCheckedChange={(v) => setDraft((d) => ({ ...d, isNationwide: v }))} />
              </div>
              {!draft.isNationwide && (
                <div className="space-y-1.5">
                  <Label htmlFor="benefit-scope">Scope</Label>
                  <Input id="benefit-scope" value={draft.scopeName} onChange={(e) => setDraft((d) => ({ ...d, scopeName: e.target.value }))} placeholder="e.g. Metro Manila" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="requirements" className="space-y-3">
              {draft.requirements.map((req, index) => (
                <Card key={index} className="gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Input
                      value={req.englishName}
                      placeholder="Requirement name"
                      onChange={(e) => updateRequirement(index, { englishName: e.target.value })}
                      className="font-medium"
                    />
                    <Button type="button" size="icon" variant="ghost" className="size-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setDraft((d) => ({ ...d, requirements: d.requirements.filter((_, i) => i !== index) }))}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    value={req.englishDescription}
                    placeholder="Description"
                    onChange={(e) => updateRequirement(index, { englishDescription: e.target.value })}
                  />
                  <DocumentChips documents={req.documents} onChange={(documents) => updateRequirement(index, { documents })} />
                </Card>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    requirements: [...d.requirements, { englishName: "", tagalogName: "", englishDescription: "", tagalogDescription: "", documents: [] }],
                  }))
                }
              >
                <Plus /> Add Requirement
              </Button>
            </TabsContent>

            <TabsContent value="utilization" className="space-y-3">
              {draft.utilizations.map((util, index) => (
                <Card key={index} className="gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Input
                      value={util.englishName}
                      placeholder="Utilization tip name"
                      onChange={(e) => updateUtilization(index, { englishName: e.target.value })}
                      className="font-medium"
                    />
                    <Button type="button" size="icon" variant="ghost" className="size-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setDraft((d) => ({ ...d, utilizations: d.utilizations.filter((_, i) => i !== index) }))}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    value={util.englishDescription}
                    placeholder="Notes — how to effectively use this benefit"
                    onChange={(e) => updateUtilization(index, { englishDescription: e.target.value })}
                  />
                </Card>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    utilizations: [...d.utilizations, { englishName: "", tagalogName: "", englishDescription: "", tagalogDescription: "" }],
                  }))
                }
              >
                <Plus /> Add Utilization Tip
              </Button>
            </TabsContent>

            <TabsContent value="eligibility">
              <RuleTreeBuilder fields={topLevelFields} tree={draft.eligibilityTree} onChange={(tree) => setDraft((d) => ({ ...d, eligibilityTree: tree }))} />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t border-border pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !draft.name}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {benefit ? "Save Changes" : "Create Benefit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DocumentChips({ documents, onChange }: { documents: string[]; onChange: (docs: string[]) => void }) {
  const [draft, setDraft] = React.useState("");

  const add = () => {
    if (!draft.trim()) return;
    onChange([...documents, draft.trim()]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {documents.map((doc) => (
          <Badge key={doc} variant="secondary" className="gap-1">
            <FileText className="size-2.5" />
            {doc}
            <X className="size-3 cursor-pointer" onClick={() => onChange(documents.filter((d) => d !== doc))} />
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Reference document name…"
          className="h-8 text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" size="sm" variant="secondary" className="h-8" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  );
}
