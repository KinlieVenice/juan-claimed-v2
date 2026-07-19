import { Router } from "express";
import {
  getAllGroups,
  getGroupById,
  createGroup,
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

// Note: If you added an update/delete function in your group controller later,
// you can easily plug them in like this:
// groupRouter.put("/:id", validateBody(createUpdateGroupSchema), updateGroup);
// groupRouter.delete("/:id", deleteGroup);
