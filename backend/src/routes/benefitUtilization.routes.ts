import { Router } from "express";
import {
  listBenefitUtilizations,
  createBenefitUtilization,
  editBenefitUtilization,
  deleteBenefitUtilization,
} from "../controllers/benefitUtilization.controller.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { benefitUtilizationSchema } from "../requests/benefitUtilization.request.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const benefitUtilizationRouter = Router({ mergeParams: true });

benefitUtilizationRouter.get("/", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), listBenefitUtilizations);

benefitUtilizationRouter.post(
  "/",
  mockAuth,
  requireRole(PERMISSIONS.CREATE_BENEFIT_UTILIZATIONS),
  validateBody(benefitUtilizationSchema),
  createBenefitUtilization,
);

benefitUtilizationRouter.patch(
  "/:id",
  mockAuth,
  requireRole(PERMISSIONS.EDIT_BENEFIT_UTILIZATIONS),
  validateBody(benefitUtilizationSchema),
  editBenefitUtilization,
);

benefitUtilizationRouter.delete(
  "/:id",
  mockAuth,
  requireRole(PERMISSIONS.DELETE_BENEFIT_UTILIZATIONS),
  deleteBenefitUtilization,
);
