import { Router } from "express";
import {
  createBenefit,
  editBenefit,
  deleteBenefit,
} from "../controllers/benefit.controller.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { createBenefitSchema, editBenefitSchema } from "../requests/benefit.request.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const benefitRouter = Router();

benefitRouter.post(
  "/",
  mockAuth,
  requireRole(PERMISSIONS.CREATE_BENEFITS),
  validateBody(createBenefitSchema),
  createBenefit,
);

benefitRouter.patch(
  "/:id",
  mockAuth,
  requireRole(PERMISSIONS.EDIT_BENEFITS),
  validateBody(editBenefitSchema),
  editBenefit,
);

benefitRouter.delete(
  "/:id",
  mockAuth,
  requireRole(PERMISSIONS.DELETE_BENEFITS),
  deleteBenefit,
);
