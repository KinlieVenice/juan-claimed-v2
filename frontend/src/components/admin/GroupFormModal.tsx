import * as React from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAlert } from "@/lib/alert-store";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";
import { createGroup, updateGroup, type UserGroup } from "@/services/users.service";
import { Button } from "@/components/ui/button";
import { TextField, TextareaField } from "@/components/ui/text-field";
import { ModalSection } from "@/components/ui/modal";
import { SidePanel } from "@/components/ui/side-panel";

interface GroupFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create mode; otherwise editing this group. */
  group: UserGroup | null;
  onSaved: () => void;
}

const FORM_ID = "group-form";
const EMPTY_FORM = { englishName: "", tagalogName: "", englishDescription: "", tagalogDescription: "" };

export function GroupFormModal({ open, onOpenChange, group, onSaved }: GroupFormModalProps) {
  const { token } = useAuth();
  const { showAlert, showApiError } = useAlert();
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [submitting, setSubmitting] = React.useState(false);

  const nameTranslate = useAutoTranslate({
    sourceValue: form.englishName,
    onTargetChange: (v) => setForm((f) => ({ ...f, tagalogName: v })),
    token,
  });
  const descriptionTranslate = useAutoTranslate({
    sourceValue: form.englishDescription,
    onTargetChange: (v) => setForm((f) => ({ ...f, tagalogDescription: v })),
    token,
  });

  React.useEffect(() => {
    if (!open) return;
    setForm(
      group
        ? {
            englishName: group.englishName,
            tagalogName: group.tagalogName,
            englishDescription: group.englishDescription,
            tagalogDescription: group.tagalogDescription,
          }
        : EMPTY_FORM,
    );
  }, [open, group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    try {
      const saved = group ? await updateGroup(group.id, form, token) : await createGroup(form, token);
      onSaved();
      onOpenChange(false);
      showAlert({ variant: "success", message: saved.message });
    } catch (err) {
      showApiError(err, "Could not save this group.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SidePanel
      open={open}
      onOpenChange={onOpenChange}
      size="xs"
      title={group ? "Edit Group" : "Add Group"}
      description="National agencies and organizations that create benefits."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {group ? "Save Changes" : "Create Group"}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6">
        <ModalSection title="English">
          <TextField
            label="Name"
            value={form.englishName}
            onChange={(v) => setForm((f) => ({ ...f, englishName: v }))}
            required
          />
          <TextareaField
            label="Description"
            value={form.englishDescription}
            onChange={(v) => setForm((f) => ({ ...f, englishDescription: v }))}
            required
          />
        </ModalSection>

        <ModalSection title="Tagalog">
          <TextField
            label="Name"
            value={form.tagalogName}
            onChange={nameTranslate.handleTargetChange}
            required
            badge={nameTranslate.badge}
          />
          <TextareaField
            label="Description"
            value={form.tagalogDescription}
            onChange={descriptionTranslate.handleTargetChange}
            required
            badge={descriptionTranslate.badge}
          />
        </ModalSection>
      </form>
    </SidePanel>
  );
}
