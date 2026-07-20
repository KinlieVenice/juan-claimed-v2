import * as React from "react";
import { Loader2, Paperclip, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useAlert } from "@/lib/alert-store";
import { uploadAttachmentFile } from "@/services/attachments.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`);

// Mirrors backend/src/requests/benefitAttachment.request.ts's ALLOWED_ATTACHMENT_FILE_TYPES
// — purely a UI hint for the file picker; the backend enforces the real allowlist itself.
const ACCEPTED_FILE_TYPES = ".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx";

export interface LocalAttachment {
  localId: string;
  /** Present = an already-saved attachment; absent = uploaded this session, not saved yet. */
  id?: string;
  fileLabel: string;
  fileName: string;
  fileType: string;
  /** The Vercel Blob URL, already uploaded — this component only ever holds fully-uploaded
   * files, never an in-flight one (see the `uploading` state below for that in-between). */
  filePath: string;
  fileSize: number;
}

interface AttachmentUploaderProps {
  attachments: LocalAttachment[];
  onChange: (attachments: LocalAttachment[]) => void;
  /** An existing (has `id`) attachment was removed — the bundle save's "omitted = left
   * untouched" rule means this needs its own DELETE call after save, same pattern
   * FieldFormModal.tsx uses for deletedOptionIds/deletedSubfieldIds/etc. */
  onRemoveExisting: (attachmentId: string) => void;
  disabled?: boolean;
}

// File picker + direct-to-Blob upload + attached-file list, shared by every Requirements/
// Utilization/How to Apply row (BenefitItemListEditor.tsx) instead of three copies. The
// upload itself happens immediately on pick (attachments.service.ts) — by the time this
// shows up in `attachments`, the file is already sitting in Blob storage; only the
// metadata row (FctAttachment) is created later, as part of the whole benefit's save.
export function AttachmentUploader({ attachments, onChange, onRemoveExisting, disabled }: AttachmentUploaderProps) {
  const { token } = useAuth();
  const { showApiError } = useAlert();
  const [uploading, setUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be picked again later (e.g. after removing it)
    if (!file || !token) return;

    setUploading(true);
    try {
      const uploaded = await uploadAttachmentFile(file, token);
      onChange([...attachments, { localId: newId(), fileLabel: file.name, ...uploaded }]);
    } catch (err) {
      showApiError(err, "Could not upload this file.");
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (attachment: LocalAttachment) => {
    if (attachment.id) onRemoveExisting(attachment.id);
    onChange(attachments.filter((a) => a.localId !== attachment.localId));
  };

  return (
    <div className="space-y-2">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((attachment) => (
            <Badge key={attachment.localId} variant="secondary" className="gap-1">
              <FileText className="size-3" />
              <span className="max-w-40 truncate">{attachment.fileLabel}</span>
              {!disabled && (
                <span
                  role="button"
                  aria-label={`Remove ${attachment.fileLabel}`}
                  // Same enlarged-hit-target fix as MultiSearchableSelect's badge X — a
                  // plain 12px icon here is too easy to miss.
                  className={cn("-m-1 flex cursor-pointer items-center rounded-full p-1 hover:bg-black/10")}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    removeAttachment(attachment);
                  }}
                >
                  <X className="size-3" />
                </span>
              )}
            </Badge>
          ))}
        </div>
      )}

      {!disabled && (
        <>
          <input ref={inputRef} type="file" className="hidden" accept={ACCEPTED_FILE_TYPES} onChange={handleFileChange} />
          <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Paperclip className="size-3.5" />}
            {uploading ? "Uploading…" : "Attach File"}
          </Button>
        </>
      )}
    </div>
  );
}
