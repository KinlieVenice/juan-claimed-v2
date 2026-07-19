import { Router } from "express";
import { getAllFieldInputTypes, getFieldConditionOperators } from "../controllers/fieldLookup.controller.js";

export const fieldLookupRouter = Router();

fieldLookupRouter.get("/field-input-types", getAllFieldInputTypes);
fieldLookupRouter.get("/field-condition-operators", getFieldConditionOperators);
