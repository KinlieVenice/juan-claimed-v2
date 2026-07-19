import { Router } from "express";
import { getBenefitRuleGroupById, getDynamicRuleGroupById } from "../controllers/ruleGroup.controller.js";

export const ruleGroupRouter = Router();

ruleGroupRouter.get("/benefits/:id", getBenefitRuleGroupById);
ruleGroupRouter.get("/fields/:id", getDynamicRuleGroupById);


