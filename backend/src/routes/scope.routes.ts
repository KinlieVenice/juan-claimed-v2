import { Router } from "express";
import { listScopes } from "../controllers/scope.controller.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const scopeRouter = Router();

scopeRouter.get("/", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), listScopes);
