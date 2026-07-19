import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  assignRoleAndScope,
  createUser,
  setUserActive,
  deleteUser,
} from "../controllers/user.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import {
  assignRoleSchema,
  createUserSchema,
  setUserActiveSchema,
} from "../requests/user.request.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const userRouter = Router();

// Viewing users (Everyone can view)
userRouter.get("/", mockAuth, getAllUsers);
userRouter.get("/:id", mockAuth, getUserById);

// Creating accounts (Only Superadmin)
userRouter.post(
  "/",
  mockAuth,
  requireRole(PERMISSIONS.MANAGE_USERS),
  validateBody(createUserSchema),
  createUser,
);

// Modifying roles (Only Superadmin)
userRouter.patch(
  "/:id/role",
  mockAuth,
  requireRole(PERMISSIONS.MANAGE_USERS),
  validateBody(assignRoleSchema),
  assignRoleAndScope,
);

// Activating/deactivating accounts (Only Superadmin)
userRouter.patch(
  "/:id/active",
  mockAuth,
  requireRole(PERMISSIONS.MANAGE_USERS),
  validateBody(setUserActiveSchema),
  setUserActive,
);

// Soft-deleting accounts (Only Superadmin)
userRouter.delete(
  "/:id",
  mockAuth,
  requireRole(PERMISSIONS.MANAGE_USERS),
  deleteUser,
);
