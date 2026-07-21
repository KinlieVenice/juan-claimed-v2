import { Router } from "express";
import {
  listBenefits,
  getBenefitById,
  listPublicBenefits,
  getPublicBenefitById,
  createBenefit,
  editBenefit,
  deleteBenefit,
} from "../controllers/benefit.controller.js";
import {
  listMyBenefitEligibility,
  getMyBenefitEligibility,
  listGuestBenefitEligibility,
  getGuestBenefitEligibility,
} from "../controllers/benefitEligibility.controller.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { createBenefitSchema, editBenefitSchema } from "../requests/benefit.request.js";
import { guestEligibilitySchema } from "../requests/benefitEligibility.request.js";
import { PERMISSIONS } from "../constants/permissions.js";
import { benefitRequirementRouter } from "./benefitRequirement.routes.js";
import { benefitUtilizationRouter } from "./benefitUtilization.routes.js";
import { benefitHowToApplyRouter } from "./benefitHowToApply.routes.js";

export const benefitRouter = Router();

// No auth — the "public/no account" flow ("Explore your benefits" with no login). Ahead of
// "/:id" on purpose, same reasoning as "/eligibility" below — "public" would otherwise be
// swallowed as an :id value. GET/POST are separate routing layers per method, so these
// never collide with the authenticated GET routes below even where paths look similar.
benefitRouter.get("/public", listPublicBenefits);
benefitRouter.get("/public/:id", getPublicBenefitById);
benefitRouter.post("/eligibility/guest", validateBody(guestEligibilitySchema), listGuestBenefitEligibility);
benefitRouter.post("/:id/eligibility/guest", validateBody(guestEligibilitySchema), getGuestBenefitEligibility);

benefitRouter.get("/", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), listBenefits);

// Ahead of "/:id" on purpose — "eligibility" would otherwise be swallowed as an :id value.
benefitRouter.get("/eligibility", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), listMyBenefitEligibility);

benefitRouter.get("/:id", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), getBenefitById);

benefitRouter.get("/:id/eligibility", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), getMyBenefitEligibility);

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
