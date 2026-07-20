import { Router } from "express";
import {
  getAllHierarchies,
  getHierarchyById,
  createHierarchy,
  createHierarchyLevels,
  editHierarchyLevels,
  createHierarchyNodes,
  editHierarchyNodes,
} from "../controllers/fieldHierarchy.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  createHierarchySchema,
  createHierarchyLevelsSchema,
  editHierarchyLevelsSchema,
  createHierarchyNodesSchema,
  editHierarchyNodesSchema,
} from "../requests/fieldHierarchy.request.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const fieldHierarchyRouter = Router();

fieldHierarchyRouter.get("/", mockAuth, requireRole(PERMISSIONS.VIEW_FIELDS), getAllHierarchies);
fieldHierarchyRouter.get("/:id", mockAuth, requireRole(PERMISSIONS.VIEW_FIELDS), getHierarchyById);
fieldHierarchyRouter.post("/", mockAuth, requireRole(PERMISSIONS.MANAGE_FIELD_HIERARCHIES), validateBody(createHierarchySchema), createHierarchy);

fieldHierarchyRouter.post(
  "/:id/levels",
  mockAuth,
  requireRole(PERMISSIONS.MANAGE_FIELD_HIERARCHIES),
  validateBody(createHierarchyLevelsSchema),
  createHierarchyLevels,
);
fieldHierarchyRouter.put(
  "/:id/levels",
  mockAuth,
  requireRole(PERMISSIONS.MANAGE_FIELD_HIERARCHIES),
  validateBody(editHierarchyLevelsSchema),
  editHierarchyLevels,
);

fieldHierarchyRouter.post(
  "/:id/nodes",
  mockAuth,
  requireRole(PERMISSIONS.MANAGE_FIELD_HIERARCHIES),
  validateBody(createHierarchyNodesSchema),
  createHierarchyNodes,
);
fieldHierarchyRouter.put(
  "/:id/nodes",
  mockAuth,
  requireRole(PERMISSIONS.MANAGE_FIELD_HIERARCHIES),
  validateBody(editHierarchyNodesSchema),
  editHierarchyNodes,
);
