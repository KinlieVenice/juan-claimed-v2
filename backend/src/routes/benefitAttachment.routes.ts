import { Router } from "express";
import {
  listBenefitAttachments,
  createBenefitAttachment,
  editBenefitAttachment,
  deleteBenefitAttachment,
} from "../controllers/benefitAttachment.controller.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { benefitAttachmentSchema } from "../requests/benefitAttachment.request.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const benefitAttachmentRouter = Router({ mergeParams: true });

benefitAttachmentRouter.get("/", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), listBenefitAttachments);

benefitAttachmentRouter.post(
  "/",
  mockAuth,
  requireRole(PERMISSIONS.CREATE_BENEFIT_ATTACHMENTS),
  validateBody(benefitAttachmentSchema),
  createBenefitAttachment,
);

benefitAttachmentRouter.patch(
  "/:id",
  mockAuth,
  requireRole(PERMISSIONS.EDIT_BENEFIT_ATTACHMENTS),
  validateBody(benefitAttachmentSchema),
  editBenefitAttachment,
);

benefitAttachmentRouter.delete(
  "/:id",
  mockAuth,
  requireRole(PERMISSIONS.DELETE_BENEFIT_ATTACHMENTS),
  deleteBenefitAttachment,
);
