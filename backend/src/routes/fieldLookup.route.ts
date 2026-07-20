import { Router } from "express";
import { getAllFieldInputTypes, getFieldConditionOperators } from "../controllers/fieldLookup.controller.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const fieldLookupRouter = Router();

fieldLookupRouter.get("/field-input-types", mockAuth, requireRole(PERMISSIONS.VIEW_FIELDS), getAllFieldInputTypes);
fieldLookupRouter.get("/field-condition-operators", mockAuth, requireRole(PERMISSIONS.VIEW_FIELDS), getFieldConditionOperators);
