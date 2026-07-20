import { Router } from "express";
import { getDynamicRuleGroupTree, createDynamicRuleGroupTree, editDynamicRuleGroupTree } from "../controllers/fieldRuleGroup.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { dynamicRuleTreeSchema } from "../requests/fieldRuleGroup.request.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { requireClassificationRoleByFieldIdParam } from "../middlewares/requireFieldClassificationRole.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const dynamicRuleGroupRouter = Router();

dynamicRuleGroupRouter.get("/field/:fieldId", mockAuth, requireRole(PERMISSIONS.VIEW_FIELDS), getDynamicRuleGroupTree);
dynamicRuleGroupRouter.post(
  "/field/:fieldId",
  mockAuth,
  requireRole(PERMISSIONS.CREATE_FIELDS),
  requireClassificationRoleByFieldIdParam,
  validateBody(dynamicRuleTreeSchema),
  createDynamicRuleGroupTree,
);
dynamicRuleGroupRouter.put(
  "/field/:fieldId",
  mockAuth,
  requireRole(PERMISSIONS.EDIT_FIELDS),
  requireClassificationRoleByFieldIdParam,
  validateBody(dynamicRuleTreeSchema),
  editDynamicRuleGroupTree,
);
