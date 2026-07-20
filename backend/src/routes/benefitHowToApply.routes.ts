import { Router } from "express";
import {
  listBenefitHowToApplies,
  createBenefitHowToApply,
  editBenefitHowToApply,
  deleteBenefitHowToApply,
} from "../controllers/benefitHowToApply.controller.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { benefitHowToApplySchema } from "../requests/benefitHowToApply.request.js";
import { PERMISSIONS } from "../constants/permissions.js";
import { createAttachmentRouter } from "./benefitAttachment.routes.js";

export const benefitHowToApplyRouter = Router({ mergeParams: true });

benefitHowToApplyRouter.get("/", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), listBenefitHowToApplies);

benefitHowToApplyRouter.post(
  "/",
  mockAuth,
  requireRole(PERMISSIONS.CREATE_BENEFIT_HOW_TO_APPLIES),
  validateBody(benefitHowToApplySchema),
  createBenefitHowToApply,
);

benefitHowToApplyRouter.patch(
  "/:id",
  mockAuth,
  requireRole(PERMISSIONS.EDIT_BENEFIT_HOW_TO_APPLIES),
  validateBody(benefitHowToApplySchema),
  editBenefitHowToApply,
);

benefitHowToApplyRouter.delete(
  "/:id",
  mockAuth,
  requireRole(PERMISSIONS.DELETE_BENEFIT_HOW_TO_APPLIES),
  deleteBenefitHowToApply,
);

benefitHowToApplyRouter.use("/:id/attachments", createAttachmentRouter("HOW_TO_APPLY"));
