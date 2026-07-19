import type { Request } from "express";
import { z } from "zod";

// Only images, PDF, and Word docs are accepted as benefit attachments.
export const ALLOWED_ATTACHMENT_FILE_TYPES = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const benefitAttachmentSchema = z.object({
  fileLabel: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.enum(ALLOWED_ATTACHMENT_FILE_TYPES, {
    message: `fileType must be one of: ${ALLOWED_ATTACHMENT_FILE_TYPES.join(", ")}`,
  }),
  filePath: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  metaData: z.record(z.string(), z.any()).optional().default({}),
});

export type BenefitAttachmentDto = z.infer<typeof benefitAttachmentSchema>;

export type CreateBenefitAttachmentRequest = Request<
  { benefitId: string },
  {},
  BenefitAttachmentDto
>;
export type EditBenefitAttachmentRequest = Request<
  { benefitId: string; id: string },
  {},
  BenefitAttachmentDto
>;
