import type { Request, Response } from "express";
import * as fieldService from "../services/field.service.js";
import * as ruleGroupService from "../services/ruleGroup.service.js"

// GET FIELD BY ID
export const getBenefitRuleGroupById = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    
    try {
        const ruleGroup = await ruleGroupService.fetchBenefitRuleGroupTree(id)
        
        return res.status(200).json({
          success: true,
          message: "Fields loaded successfully.",
          error: null,
          errorCode: null,
          data: ruleGroup
        });
    } catch (error) {
        console.error("[RuleGroupController] Error fetching rule groups:", error);
        return res.status(500).json({ 
          success: false,
          message: "Unable to load rule groups.",
          error: "An unexpected error occurred on the server.",
          errorCode: "SERVER_ERROR",
          data: []
        });
    }
};

export const getDynamicRuleGroupById = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;

    try {
        const ruleGroup = await ruleGroupService.fetchDynamicRuleGroupTree(id)
        
        return res.status(200).json({
          success: true,
          message: "Fields loaded successfully.",
          error: null,
          errorCode: null,
          data: ruleGroup
        });
    } catch (error) {
        console.error("[RuleGroupController] Error fetching rule groups:", error);
        return res.status(500).json({ 
          success: false,
          message: "Unable to load rule groups.",
          error: "An unexpected error occurred on the server.",
          errorCode: "SERVER_ERROR",
          data: []
        });
    }
};
