import type { Request } from "express";
import { z } from "zod";
import { ALLOWED_ATTACHMENT_FILE_TYPES } from "./benefitAttachment.request.js";

const bundleAttachmentSchema = z.object({
  fileLabel: z.string().min(1),
  fileName: z.string().min(1),
  fileType: z.enum(ALLOWED_ATTACHMENT_FILE_TYPES, {
    message: `fileType must be one of: ${ALLOWED_ATTACHMENT_FILE_TYPES.join(", ")}`,
  }),
  filePath: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  metaData: z.record(z.string(), z.any()).optional().default({}),
});

const bundleRequirementSchema = z.object({
  englishName: z.string().min(1),
  tagalogName: z.string().min(1),
  englishDescription: z.string().min(1),
  tagalogDescription: z.string().min(1),
  attachments: z.array(bundleAttachmentSchema).optional().default([]),
});

const bundleUtilizationSchema = z.object({
  englishName: z.string().min(1),
  tagalogName: z.string().min(1),
  englishDescription: z.string().min(1),
  tagalogDescription: z.string().min(1),
  attachments: z.array(bundleAttachmentSchema).optional().default([]),
});

export const createBenefitBundleSchema = z
  .object({
    name: z.string().min(1),
    englishDescription: z.string(),
    tagalogDescription: z.string(),
    nationwide: z.boolean().optional().default(false),
    psgcCodes: z.array(z.string().min(1)).optional().default([]),
    groupIds: z.array(z.string().min(1)).optional().default([]),
    requirements: z.array(bundleRequirementSchema).optional().default([]),
    utilizations: z.array(bundleUtilizationSchema).optional().default([]),
  })
  .refine((data) => data.nationwide || data.psgcCodes.length > 0, {
    message: "psgcCodes must contain at least one code unless nationwide is true.",
    path: ["psgcCodes"],
  });

export type CreateBenefitBundleDto = z.infer<typeof createBenefitBundleSchema>;

export type CreateBenefitBundleRequest = Request<{}, {}, CreateBenefitBundleDto>;

// Edit variants: same shape as create, but each requirement/utilization/
// attachment may carry an `id` — present means "edit this existing row",
// absent means "create a new one". Rows that already exist but are left
// out of the payload entirely are NOT deleted; use the individual DELETE
// endpoints for that.
const editBundleAttachmentSchema = bundleAttachmentSchema.extend({
  id: z.string().min(1).optional(),
});

const editBundleRequirementSchema = z.object({
  id: z.string().min(1).optional(),
  englishName: z.string().min(1),
  tagalogName: z.string().min(1),
  englishDescription: z.string().min(1),
  tagalogDescription: z.string().min(1),
  attachments: z.array(editBundleAttachmentSchema).optional().default([]),
});

const editBundleUtilizationSchema = z.object({
  id: z.string().min(1).optional(),
  englishName: z.string().min(1),
  tagalogName: z.string().min(1),
  englishDescription: z.string().min(1),
  tagalogDescription: z.string().min(1),
  attachments: z.array(editBundleAttachmentSchema).optional().default([]),
});

export const editBenefitBundleSchema = z
  .object({
    name: z.string().min(1),
    englishDescription: z.string(),
    tagalogDescription: z.string(),
    nationwide: z.boolean().optional().default(false),
    psgcCodes: z.array(z.string().min(1)).optional().default([]),
    groupIds: z.array(z.string().min(1)).optional().default([]),
    requirements: z.array(editBundleRequirementSchema).optional().default([]),
    utilizations: z.array(editBundleUtilizationSchema).optional().default([]),
  })
  .refine((data) => data.nationwide || data.psgcCodes.length > 0, {
    message: "psgcCodes must contain at least one code unless nationwide is true.",
    path: ["psgcCodes"],
  });

export type EditBenefitBundleDto = z.infer<typeof editBenefitBundleSchema>;

export type EditBenefitBundleRequest = Request<{ id: string }, {}, EditBenefitBundleDto>;
