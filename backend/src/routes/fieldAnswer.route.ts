import { Router } from "express";
import {
  submitFieldAnswers,
  getMyFieldAnswers,
  createAnswerGroup,
  getMyAnswerGroups,
  deleteAnswerGroup,
} from "../controllers/fieldAnswer.controller.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { submitFieldAnswersSchema, createAnswerGroupSchema } from "../requests/fieldAnswer.request.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const fieldAnswerRouter = Router();

// Self-service only in v1 — every route answers/reads for the authenticated user
// themselves (req.user.id), any authenticated role can participate.
fieldAnswerRouter.get("/", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), getMyFieldAnswers);
fieldAnswerRouter.put("/", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), validateBody(submitFieldAnswersSchema), submitFieldAnswers);

fieldAnswerRouter.post("/groups", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), validateBody(createAnswerGroupSchema), createAnswerGroup);
fieldAnswerRouter.get("/groups/:fieldId", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), getMyAnswerGroups);
fieldAnswerRouter.delete("/groups/:groupId", mockAuth, requireRole(PERMISSIONS.PARTICIPATE), deleteAnswerGroup);
