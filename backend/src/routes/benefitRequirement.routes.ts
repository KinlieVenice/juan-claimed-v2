import { Router } from "express";
import {
  listBenefitRequirements,
  createBenefitRequirement,
  editBenefitRequirement,
  deleteBenefitRequirement,
} from "../controllers/benefitRequirement.controller.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { benefitRequirementSchema } from "../requests/benefitRequirement.request.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const benefitRequirementRouter = Router({ mergeParams: true });

benefitRequirementRouter.get("/", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), listBenefitRequirements);

benefitRequirementRouter.post(
  "/",
  mockAuth,
  requireRole(PERMISSIONS.CREATE_BENEFIT_REQUIREMENTS),
  validateBody(benefitRequirementSchema),
  createBenefitRequirement,
);

benefitRequirementRouter.patch(
  "/:id",
  mockAuth,
  requireRole(PERMISSIONS.EDIT_BENEFIT_REQUIREMENTS),
  validateBody(benefitRequirementSchema),
  editBenefitRequirement,
);

benefitRequirementRouter.delete(
  "/:id",
  mockAuth,
  requireRole(PERMISSIONS.DELETE_BENEFIT_REQUIREMENTS),
  deleteBenefitRequirement,
);
