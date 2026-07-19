import { Router } from "express";
import { createAttachmentUploadToken } from "../controllers/attachmentUpload.controller.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const attachmentUploadRouter = Router();

attachmentUploadRouter.post(
  "/upload-token",
  mockAuth,
  requireRole(PERMISSIONS.CREATE_BENEFIT_ATTACHMENTS),
  createAttachmentUploadToken,
);
