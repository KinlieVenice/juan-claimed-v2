import { Router } from "express";
import {
  getAllGroups,
  getGroupById,
  createGroup,
  updateGroup,
} from "../controllers/group.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { createUpdateGroupSchema } from "../requests/group.request.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const groupRouter = Router();

groupRouter.get("/", getAllGroups);
groupRouter.get("/:id", getGroupById);

groupRouter.post(
  "/",
  mockAuth,
  requireRole(PERMISSIONS.MANAGE_GROUPS),
  validateBody(createUpdateGroupSchema),
  createGroup,
);

groupRouter.put(
  "/:id",
  mockAuth,
  requireRole(PERMISSIONS.MANAGE_GROUPS),
  validateBody(createUpdateGroupSchema),
  updateGroup,
);

// Note: no DELETE route — destructive group deletion is deferred (deliberately, matching
// this app's broader pattern of not shipping delete UI/routes unless explicitly requested).
