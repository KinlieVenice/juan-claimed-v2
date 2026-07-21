import { Router } from "express";
import { translate } from "../controllers/translate.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { translateSchema } from "../requests/translate.request.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const translateRouter = Router();

translateRouter.post("/", mockAuth, requireRole(PERMISSIONS.USE_AI_TRANSLATOR), validateBody(translateSchema), translate);
