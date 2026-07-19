import { Router } from "express";
import { createBenefitBundle, editBenefitBundle } from "../controllers/benefitBundle.controller.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { createBenefitBundleSchema, editBenefitBundleSchema } from "../requests/benefitBundle.request.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const benefitBundleRouter = Router();

benefitBundleRouter.post(
  "/",
  mockAuth,
  requireRole(PERMISSIONS.CREATE_BENEFITS),
  validateBody(createBenefitBundleSchema),
  createBenefitBundle,
);

benefitBundleRouter.patch(
  "/:id",
  mockAuth,
  requireRole(PERMISSIONS.EDIT_BENEFITS),
  validateBody(editBenefitBundleSchema),
  editBenefitBundle,
);
