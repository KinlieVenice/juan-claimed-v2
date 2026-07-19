import { Router } from "express";
import { getDynamicRuleGroupTree, createDynamicRuleGroupTree, editDynamicRuleGroupTree } from "../controllers/fieldRuleGroup.controller.js";
import { validateBody } from "../middlewares/validate.middleware.js";
import { dynamicRuleTreeSchema } from "../requests/fieldRuleGroup.request.js";

export const dynamicRuleGroupRouter = Router();

dynamicRuleGroupRouter.get("/field/:fieldId", getDynamicRuleGroupTree);
dynamicRuleGroupRouter.post("/field/:fieldId", validateBody(dynamicRuleTreeSchema), createDynamicRuleGroupTree);
dynamicRuleGroupRouter.put("/field/:fieldId", validateBody(dynamicRuleTreeSchema), editDynamicRuleGroupTree);
