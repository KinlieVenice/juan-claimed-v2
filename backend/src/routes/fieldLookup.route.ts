import { Router } from "express";
import { getAllFieldInputTypes, getFieldConditionOperators } from "../controllers/fieldLookup.controller.js";
import { mockAuth } from "../middlewares/mockAuth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { PERMISSIONS } from "../constants/permissions.js";

export const fieldLookupRouter = Router();

// No auth — same "public/no account" flow reasoning as field.route.ts's "/public". Needed
// so a guest browsing BenefitDetailsPage can resolve operator englishName/tagalogName for
// ConditionTreeView's read-only eligibility rendering (fields/hierarchies already have a
// public variant; operators didn't until now, since only admin UI needed them before).
fieldLookupRouter.get("/field-condition-operators/public", getFieldConditionOperators);

fieldLookupRouter.get("/field-input-types", mockAuth, requireRole(PERMISSIONS.VIEW_FIELDS), getAllFieldInputTypes);
fieldLookupRouter.get("/field-condition-operators", mockAuth, requireRole(PERMISSIONS.VIEW_FIELDS), getFieldConditionOperators);
