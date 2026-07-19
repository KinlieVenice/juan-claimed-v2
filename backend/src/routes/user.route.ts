import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  assignRoleAndScope,
} from "../controllers/user.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { assignRoleSchema } from "../requests/user.request.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const userRouter = Router();

// Viewing users (Everyone can view)
userRouter.get("/", mockAuth, getAllUsers);
userRouter.get("/:id", mockAuth, getUserById);

// Modifying roles (Only Superadmin)
userRouter.patch(
  "/:id/role",
  mockAuth,
  requireRole(PERMISSIONS.MANAGE_USERS),
  validateBody(assignRoleSchema),
  assignRoleAndScope,
);
