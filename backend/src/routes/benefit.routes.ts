import { Router } from "express";
import {
  listBenefits,
  getBenefitById,
  createBenefit,
  editBenefit,
  deleteBenefit,
} from "../controllers/benefit.controller.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { createBenefitSchema, editBenefitSchema } from "../requests/benefit.request.js";
import { PERMISSIONS } from "../constants/permissions.js";
import { benefitRequirementRouter } from "./benefitRequirement.routes.js";
import { benefitUtilizationRouter } from "./benefitUtilization.routes.js";
import { benefitHowToApplyRouter } from "./benefitHowToApply.routes.js";

export const benefitRouter = Router();

benefitRouter.get("/", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), listBenefits);

benefitRouter.get("/:id", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), getBenefitById);

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

benefitRouter.use("/:benefitId/requirements", benefitRequirementRouter);
benefitRouter.use("/:benefitId/utilizations", benefitUtilizationRouter);
benefitRouter.use("/:benefitId/how-to-apply", benefitHowToApplyRouter);
