import * as React from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TextField, TextareaField } from "@/components/ui/text-field";
import { Label } from "@/components/ui/label";
import { AttachmentUploader, type LocalAttachment } from "@/components/benefits/AttachmentUploader";
import type { BenefitItemInput } from "@/services/benefits.service";

const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`);

export interface LocalBenefitItem {
  localId: string;
  id?: string;
  englishName: string;
  tagalogName: string;
  englishDescription: string;
  tagalogDescription: string;
  attachments: LocalAttachment[];
}

export const emptyBenefitItem = (): LocalBenefitItem => ({
  localId: newId(),
  englishName: "",
  tagalogName: "",
  englishDescription: "",
  tagalogDescription: "",
  attachments: [],
});

export function stripBenefitItems(items: LocalBenefitItem[]): BenefitItemInput[] {
  return items.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    englishName: item.englishName,
    tagalogName: item.tagalogName,
    englishDescription: item.englishDescription,
    tagalogDescription: item.tagalogDescription,
    attachments: item.attachments.map((a) => ({
      ...(a.id ? { id: a.id } : {}),
      fileLabel: a.fileLabel,
      fileName: a.fileName,
      fileType: a.fileType,
      filePath: a.filePath,
      fileSize: a.fileSize,
    })),
  }));
}

interface BenefitItemListEditorProps {
  items: LocalBenefitItem[];
  onChange: (items: LocalBenefitItem[]) => void;
  onRemoveExisting: (id: string) => void;
  onRemoveExistingAttachment: (itemId: string, attachmentId: string) => void;
  addLabel: string;
  emptyHint: string;
}

// One shared collapsible-row list editor for Requirements/Utilizations/How to Apply — all
// three share the exact same shape server-side (benefitBundle.request.ts), so this replaces
// what would otherwise be three near-identical editors. Structurally mirrors
// RepeaterSubfieldsEditor.tsx / FieldConditionalChildrenEditor.tsx's row pattern (collapsed
// header + expandable body, no drag reordering).
export function BenefitItemListEditor({ items, onChange, onRemoveExisting, onRemoveExistingAttachment, addLabel, emptyHint }: BenefitItemListEditorProps) {
  const updateItem = (localId: string, patch: Partial<LocalBenefitItem>) => {
    onChange(items.map((item) => (item.localId === localId ? { ...item, ...patch } : item)));
  };

  const removeItem = (item: LocalBenefitItem) => {
    if (item.id) onRemoveExisting(item.id);
    onChange(items.filter((i) => i.localId !== item.localId));
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-xs text-muted-foreground">{emptyHint}</p>}

      <div className="space-y-3">
        {items.map((item) => (
          <ItemRow
            key={item.localId}
            item={item}
            onChange={(patch) => updateItem(item.localId, patch)}
            onRemove={() => removeItem(item)}
            onRemoveExistingAttachment={(attachmentId) => item.id && onRemoveExistingAttachment(item.id, attachmentId)}
          />
        ))}
      </div>

      <Button type="button" size="sm" variant="outline" onClick={() => onChange([...items, emptyBenefitItem()])}>
        <Plus /> {addLabel}
      </Button>
    </div>
  );
}

function ItemRow({
  item,
  onChange,
  onRemove,
  onRemoveExistingAttachment,
}: {
  item: LocalBenefitItem;
  onChange: (patch: Partial<LocalBenefitItem>) => void;
  onRemove: () => void;
  onRemoveExistingAttachment: (attachmentId: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(!item.id);

  return (
    <div className={cn("rounded-lg border border-border bg-card")}>
      <div className="flex items-center gap-2 p-3">
        <button type="button" onClick={() => setExpanded((e) => !e)} className="text-muted-foreground">
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{item.englishName || "Untitled"}</p>
          <p className="truncate text-xs text-muted-foreground">{item.attachments.length > 0 ? `${item.attachments.length} attachment(s)` : "No attachments"}</p>
        </div>
        <Button type="button" size="icon" variant="ghost" className="size-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-border p-3">
          <div className="grid grid-cols-2 gap-4">
            <TextField label="English Name" value={item.englishName} onChange={(v) => onChange({ englishName: v })} required />
            <TextField label="Tagalog Name" value={item.tagalogName} onChange={(v) => onChange({ tagalogName: v })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <TextareaField label="English Description" value={item.englishDescription} onChange={(v) => onChange({ englishDescription: v })} required />
            <TextareaField label="Tagalog Description" value={item.tagalogDescription} onChange={(v) => onChange({ tagalogDescription: v })} required />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground">Attachments</Label>
            <AttachmentUploader
              attachments={item.attachments}
              onChange={(attachments) => onChange({ attachments })}
              onRemoveExisting={onRemoveExistingAttachment}
            />
          </div>
        </div>
      )}
    </div>
  );
}
