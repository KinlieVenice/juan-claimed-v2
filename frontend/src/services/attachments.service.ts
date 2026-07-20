// Real — wraps Vercel Blob's client-side upload flow against our
// POST /api/attachments/upload-token (backend/routes.md's "Attachments & Vercel Blob"
// section). `upload()` calls that route itself (fetching a short-lived client token),
// then uploads the file bytes directly to Blob — file bytes never touch our Express
// server. The result is just metadata (a blob URL + basic file info) meant to be attached
// to a requirement/utilization/how-to-apply row's `attachments[]` in the SAME
// createBenefitBundle/updateBenefitBundle call that saves everything else — this only
// uploads the file, it never calls the per-attachment CRUD endpoints directly (those need
// a parent id that may not exist yet for a brand-new item).
import { upload } from "@vercel/blob/client";
import { API_BASE_URL } from "@/lib/api";

export interface UploadedAttachmentFile {
  fileName: string;
  fileType: string;
  /** The Vercel Blob URL — save this as the attachment's filePath. */
  filePath: string;
  fileSize: number;
}

export async function uploadAttachmentFile(file: File, token: string): Promise<UploadedAttachmentFile> {
  const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: `${API_BASE_URL}/api/attachments/upload-token`,
    headers: { Authorization: `Bearer ${token}` },
  });

  return {
    fileName: file.name,
    fileType: file.type,
    filePath: blob.url,
    fileSize: file.size,
  };
}
